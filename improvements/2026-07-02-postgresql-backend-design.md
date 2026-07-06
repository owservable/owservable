# PostgreSQL Backend for Owservable — Design
**Date:** July 2, 2026
**Project:** owservable (main package)
**Status:** Proposal
**Impact:** Major — adds a second database backend; wire protocol unchanged

## Summary

Add PostgreSQL as a second live-data backend alongside MongoDB. The store layer is ~90% database-agnostic already; Mongo specifics are concentrated in a few seams. A PG backend built on LISTEN/NOTIFY (+ PK-refetch enrichment) and MikroORM can emit the exact same normalized change events and answer the exact same queries — so `OwservableClient`, the subscribe/unsubscribe/reload protocol, middlewares, throttling, diffing, and every existing client application work byte-for-byte unchanged. Clients simply subscribe with `observe: '<pg_table>'`.

## Ecosystem impact

| Package | Mongo coupling | Affected |
|---|---|---|
| `owservable` (current) | `src/mongodb/`, `AStore._model`, store query calls, `CollectionsModelsMap`, `processModels` | Source of the copied code; the package itself stays untouched — new work lands in the `@owservable/core`/`mongodb`/`postgres` trio (see Packaging) |
| `@owservable/actions` | none | No — becomes a dependency of `@owservable/core`, unchanged |
| `@owservable/fastify-auto-routes` | none | No |
| `@owservable/folders` | none | No — becomes a dependency of `@owservable/core`, unchanged |

## Current architecture (the seams)

Live pipeline: `ObservableModel` (`src/mongodb/functions/observable.model.ts`) wraps a MongoDB change stream (one cached stream per collection via `ObservableModelsMap`) and emits a normalized change:

```
{ns, documentKey, operationType, updateDescription, fullDocument}
```

`AStore.restartSubscription()` subscribes to it (throttled), `shouldReload(change)` decides relevance, stores re-query and emit. The only Mongo touchpoints:

1. **Change feed** — `collection.watch()` in `ObservableModel`.
2. **Model handle** — `AStore._model: Model<any>`; `find/countDocuments/populate/toJSON` inside `CollectionStore`/`DocumentStore`/`CountStore`.
3. **Registry** — `CollectionsModelsMap` (`observe` name → model), used by `storeFactory`.
4. **`processModels`** — folder scan that registers models.

Notably DB-agnostic already: `testDocument` uses `sift`, which evaluates Mongo-syntax queries against plain JS objects — a PG row as JSON works unchanged. `OwservableClient`, `DataMiddlewareMap`, and the cronjobs/workers/watchers machinery never touch mongoose.

## Change event mapping

| Change stream field | PostgreSQL source |
|---|---|
| `operationType` | `TG_OP` → insert/update/delete |
| `documentKey._id` | primary key from `NEW`/`OLD` |
| `updateDescription.updatedFields/removedFields` | changed-column diff of `to_jsonb(OLD)` vs `to_jsonb(NEW)`, computed in the trigger |
| `fullDocument` | re-fetched by PK on notify (see enrichment below) |
| `ns` | `TG_TABLE_SCHEMA`/`TG_TABLE_NAME` |

### Change capture

One generic trigger function, installed idempotently (`CREATE OR REPLACE FUNCTION` / `CREATE OR REPLACE TRIGGER`, **requires PostgreSQL 14+**), attached per table. Payload: table, op, pk, changed column names. NOTIFY payloads cap at ~8KB — never include row data.

### PK-refetch enrichment

The PG adapter's `PostgresObservableTable` enriches keys-only notifications by fetching the row by PK before emitting the normalized change (one indexed lookup per change). Deletes skip the fetch — `documentKey` alone suffices, matching `CollectionStore.loadIncremental`'s delete path. This keeps incremental mode fully working without hitting the NOTIFY size cap. Where Mongo needs N change streams, PG needs exactly **one** LISTEN connection (dedicated non-pooled client, auto-reconnect + re-LISTEN, forced store reload after reconnect to cover the missed-notification window).

### Query execution

MikroORM's `FilterQuery` is deliberately Mongo-flavored — `$and`, `$or`, `$in`, `$gt`, `$ne` work natively. The client's existing Mongo-style `config.query` passes nearly verbatim to `em.find()`; `populates` map to relation population; sort/paging map trivially. `virtuals` are skipped for PG in v1. `sift` keeps handling the `testDocument` relevance check on enriched rows.

## Refactor plan

1. **Extract `IObservableBackend`** — `changes$` (normalized change Subject), `find(query, fields, paging, sort)`, `findOne`, `count`, `populate`. `AStore` and the three stores depend on it instead of `Model<any>`.
2. **Mongoose adapter** — thin wrapper around today's code; zero behavior change.
3. **PG adapter** (`src/postgres/`, parallel to `src/mongodb/`) — `PostgresConnector` (MikroORM init + LISTEN client), `PostgresObservableTable` + `PostgresObservableTablesMap`, `processPostgresEntities` registering tables into the shared registry so `storeFactory` resolves either backend by `observe` name.
4. **Trigger bootstrap helper** — exports the `CREATE OR REPLACE` DDL install, iterating registered entities.

### Entity discovery — `processPostgresEntities`

Mirrors `processModels` (same recursive walk via `listSubfoldersByName`, one default export per file), with one structural difference: mongoose models self-register into mongoose's global registry at import time, so `processModels` is pure side effect — but MikroORM needs the complete class list up front at `MikroORM.init({entities})`, so `processPostgresEntities` **returns the collected classes** and must run *before* the PG connector init:

```ts
processMongoModels(rootFolder, 'models', ['mixins', 'schemas']);
await MongoDBConnector.init(uri);

const entities: EntityClass<any>[] = processPostgresEntities(rootFolder, 'pgmodels');
await PostgresConnector.init(entities);
```

- Signature mirrors `processModels`: `processPostgresEntities(root: string, name: string = 'entities', exclude?: string | string[]): EntityClass<any>[]`.
- Per file: `require(fullPath).default` → push into the result array + `PostgresTablesEntitiesMap.addTableToEntityMapping(entity)` (table name from `@Entity({tableName})` metadata) so `storeFactory` resolves `observe: '<table>'` to the PG backend the same way `MongoCollectionsModelsMap` resolves Mongo collections.
- **The folder name is a parameter**, exactly like `processModels`. The library default is `entities` (MikroORM idiom); consuming apps pick their own convention — e.g. systools uses `pgmodels/` for symmetry with its `models/` folders. The folder must be a *sibling* of `models/`, never nested inside it: `processMongoModels` walks `models/` recursively and would try to register entity classes as mongoose models.
- Both decorator entity classes and `EntitySchema` instances are valid default exports — `MikroORM.init` accepts either, so apps choose per taste (decorators need `experimentalDecorators` + `emitDecoratorMetadata`).
- Shared base entities (timestamps, audit fields — the mixin analog, as `@Entity({abstract: true})` base classes) live in a subfolder passed via `exclude`, matching the mongoose `['mixins', 'schemas']` exclusion.
- Live-update opt-in: a `@PostgresLiveUpdates()` decorator (or `EntitySchema` flag) adds the entity to the registry that the trigger bootstrap iterates — one line to make a table live.

## Packaging — decided: greenfield package trio

Build `@owservable/core` + `@owservable/mongodb` + `@owservable/postgres` as **new packages**, leaving the existing `owservable` package untouched — it keeps serving current consumers unchanged until they migrate.

What goes where (per the mongoose-coupling audit: only `src/mongodb/**`, the store layer, and the barrel import mongoose):

| Destination | Contents | Copy or refactor |
|---|---|---|
| `@owservable/core` | `owservable.client.ts`, `middleware/`, `enums/`, `types/`, `auth/`, `functions/` (cronjobs, workers, watchers, actions, performance) | verbatim copy |
| `@owservable/core` | `store/` (`AStore` + 3 stores + `store.factory`) | the refactor: `Model<any>` → `IObservableBackend` + a backend registry that adapters populate (replaces the factory's direct `CollectionsModelsMap` import) |
| `@owservable/mongodb` | `src/mongodb/**` (connector, `ObservableModel`, maps, `processModels`, index helpers) | copy, reshaped as an adapter implementing `IObservableBackend` |
| `@owservable/postgres` | LISTEN client, `PostgresObservableTable`, `processPostgresEntities`, MikroORM query execution, trigger bootstrap, `@PostgresLiveUpdates()` | new code |

Dependency distribution: `rxjs`/`sift`/`jsondiffpatch`/`lodash`/`node-cron` + `@owservable/actions` + `@owservable/folders` in core; `mongoose` only in `@owservable/mongodb`; `pg` + `@mikro-orm/postgresql` only in `@owservable/postgres`. No optional-peer-dependency tricks needed — each app installs core plus exactly the adapters it uses.

Notes:

- **Greenfield refactor freedom** — nothing depends on the new core yet, so the interface extraction happens with zero backward-compat constraints and zero risk to the shipped package.
- **The wire protocol is the compat contract** — message shapes (`update`/`increment`/`total`/`delete`/`debug`/`ping`, `_<target>Count`, subscription config semantics) must stay byte-identical. Port the existing test suite into core as the specification.
- **Dual-maintenance window** — store/client bugfixes must be applied to both old `owservable` and new core until consumers migrate. Keep the window short (migrate systools-server first, as the primary consumer).
- **Old package future — decided (2026-07-03): freeze, no metapackage.** `owservable` 2.x stays published and working, critical fixes only, README points new users to the trio. The metapackage option (owservable@3 re-exporting core+mongodb) was rejected: it would not be a true drop-in (store constructors now take `IObservableBackend` instead of `Model`, and `storeFactory` resolves via `BackendRegistry`), it adds a fourth artifact in permanent version lockstep, and the real migration is small anyway — import swaps only, since the wire protocol is unchanged and clients need no changes. Reversible: a metapackage can still be built later if consumer demand appears.
- **Repo mechanics** — repo-per-package, following org convention (repo name = package name sans scope): `github.com/owservable/core`, `github.com/owservable/mongodb`, `github.com/owservable/postgres`, cloned as siblings into the local `owservable/` folder and added to `owservable.code-workspace`. Scaffolding template: `fastify-auto-routes` (already pnpm-based — tsconfig, eslint.config.mjs, jest + sonar config, LICENSE, scoped-package publishConfig). During development, link sibling repos with `pnpm link ../core`; publish order is core → adapters.
- **`@owservable/core` must be a peerDependency of both adapters** — the backend registry in core is a singleton; if an adapter bundled its own copy of core, the registry would split and `storeFactory` would never see that adapter's registrations.
- **Versioning** — start the trio at 3.0.0 to signal lineage (the 2.x family stays as-is).
- **API naming — decided (2026-07-03): DB-prefixed public API in the adapters.** Every adapter export carries its database. Classes/types are noun phrases and lead with the DB name (`PostgresTablesEntitiesMap`, `PostgresObservableTable`, `MongoCollectionsModelsMap`, `MongoObservableModel`); functions stay verb-first with the DB name qualifying the object of the verb (`installPostgresTriggers`, `processPostgresEntities`, `processMongoModels`, `observableMongoModel`, `addMongoIndexToAttributes`). Rationale: apps import both adapters side by side, so unprefixed names hide the database from readers, break grep, and will collide across future adapters (mysql/mssql `installTriggers`). Done before the adapters' first publish — zero breaking-change cost. `@owservable/core` keeps generic names by design (`BackendRegistry`, `storeFactory` are intentionally database-neutral); the 2.x → 3.x rename mapping lives in the `@owservable/mongodb` README.

Rejected alternative: extending `owservable` in place with `pg`/MikroORM as optional peer dependencies (lazy-required). Workable, but it burdens the shipped package with dual-backend complexity, requires peer-dependency gymnastics, and the refactor would carry in-place compat risk — the clean split was preferred.

## Effort estimate

| Work | Estimate |
|---|---|
| Interface extraction (AStore + 3 stores + factory + maps) | 2–4 days |
| PG adapter (listener, PostgresObservableTable, MikroORM execution, registry) | 2–3 days |
| Trigger bootstrap helper | trivial |
| Tests (mirror existing store/model suites for the PG adapter) | 1–2 days |

## v3.1 candidate — cross-table invalidation (`touches`)

**Status:** speced 2026-07-03, not scheduled.

**Problem.** Subscription *data* can include joined relations (`populates` → MikroORM joins), but *invalidation* is root-table-only: each store listens to exactly one `PostgresObservableTable`, and triggers fire per table. A change that touches only a joined table (author renamed, child row inserted) never notifies the parent's subscriptions — populated data goes stale until the root row changes. (Same limitation as the Mongo adapter and owservable 2.x `populates`; clients have historically composed per-collection subscriptions instead.)

**Feature.** Let a child entity declare that its changes semantically *touch* its parent:

```ts
@PostgresLiveUpdates({touches: ['post']})
@Entity({tableName: 'comments'})
export default class Comment {
	@ManyToOne(() => Post)
	post!: Post;
	...
}
```

`touches` entries name **relation properties** (not table names) — the trigger generator resolves everything from MikroORM metadata: target entity → parent `tableName`, relation prop → FK column. No manual SQL, no duplicated knowledge.

**Generated trigger.** For each `touches` entry, `installPostgresTriggers` emits an additional trigger on the child table using a second generic function `owservable_touch_notify(parent_table, fk_column)`:

- INSERT/UPDATE: notify `{table: <parent_table>, op: 'update', id: NEW-><fk_column>}`; DELETE uses `OLD`.
- **Reparenting**: on UPDATE where `OLD.fk IS DISTINCT FROM NEW.fk`, notify **both** parent ids (old parent lost a child, new parent gained one).
- `NULL` FK → no notify.
- Trigger name: `<child>_touches_<parent>_owservable_notify` (idempotent `CREATE OR REPLACE`, PG 14+ as before).

**Why the payload shape works with zero store/core changes.** The parent's `PostgresObservableTable` receives an ordinary-looking `update` notification and PK-refetches the parent row; the synthesized event carries **no `updateDescription`**, which every store already treats as "reload" (`CollectionStore.shouldReload`: `if (!updateDescription) return true`) — deliberately bypassing field-intersection filtering, since the change was in another table. `CountStore` correctly ignores it (child changes don't alter parent counts). Bursts of child writes collapse into the stores' existing throttle. The feature is confined to the decorator options, the registry, and the trigger generator.

**Scope limits (v3.1).**

- One hop, direct FK only. Deep chains = chain `touches` hop by hop; many-to-many = flag the pivot entity with `touches` to both sides.
- The child entity does not itself need to be live — `touches` works with or without the child's own subscriptions.
- Not chosen: wal2json logical decoding for full dependency tracking — real cross-table completeness, but heavy ops (replication slots, `wal_level=logical`) against this package's zero-config trigger story.

**Effort.** Decorator options type + registry (~0.5d), `owservable_touch_notify` + generator incl. reparenting/NULL branches (~0.5d), stores/core untouched, tests incl. reparenting and NULL-FK paths (~1d).

## Adapter candidate — @owservable/sqlite (cross-process change capture)

**Status:** BUILT 2026-07-07 (repo `owservable/sqlite`, v3.0.0, all gates green incl. external-writer integration test) — pending publish.
**Motivating use case:** a companion UI for [mastra.ai](https://mastra.ai/) — mastra's default local storage is SQLite/libsql (memory threads, traces, workflow snapshots), and a Vue console subscribing through owservable would show agent activity live. The defining constraint: **the writers are other backend processes** (mastra agents/workflows), not the owservable server. Same design also serves desktop/electron tools and local-first apps.

### Why the postgres pattern doesn't transplant directly

SQLite has no LISTEN/NOTIFY and no server, and its native update hooks fire only for changes on the *same connection* — invisible to other processes. ORM flush events have the same blind spot. Change capture must be **database-level**:

1. **Journal-table triggers** — `installSqliteTriggers` creates a small `_owservable_changes` journal (`id INTEGER PRIMARY KEY AUTOINCREMENT, table_name, op, pk, changed, created_at`) plus `AFTER INSERT/UPDATE/DELETE` triggers on each watched table. SQLite triggers fire **regardless of which connection or process writes** — this is what makes external writers visible. The `changed` column list is generated per table from entity metadata as `CASE WHEN OLD.col IS NOT NEW.col …` comparisons — same information the postgres trigger derives from `to_jsonb` diffing. Idempotency via `DROP TRIGGER IF EXISTS` + `CREATE TRIGGER` (SQLite lacks `CREATE OR REPLACE TRIGGER`); the bootstrap re-runs at every connector init, which also self-heals if an external schema owner recreates its tables.
2. **`SqliteJournalPoller`** (the `PostgresListener` seat) — every ~250 ms reads `WHERE id > lastSeen ORDER BY id` from the journal (indexed range scan on a usually-empty table ≈ free) and emits the same normalized notifications; prunes consumed rows periodically. `PRAGMA data_version` (a near-free per-connection counter that moves when any *other* connection commits) can gate the poll as an optimization — but not replace it, since it does not move for same-connection writes.
3. **Everything downstream is byte-identical**: `SqliteObservableTable` with PK-refetch enrichment, `SqliteBackend` ≈ `PostgresBackend` verbatim (driver import + the same query/sort/fields/populate translations), `BackendRegistry`, stores, websocket, clients.

### Connector specifics

- MikroORM driver: `@mikro-orm/sqlite` (better-sqlite3) or `@mikro-orm/libsql`; same `defineEntity` + `updateSchema({safe})` flow.
- **`updateSchema: false` mode matters here**: for externally-owned schemas (mastra's tables), entities are read-mappings over existing tables — the connector must not touch the schema, only attach journal triggers and register backends.
- **WAL mode is mandatory** (`PRAGMA journal_mode=WAL` + `busy_timeout`) for the multi-process case — external writer + owservable reader on the same file. Local file only; remote libsql (Turso/sqld) has no shared file and is out of scope.
- Exports follow the DB-prefixed API convention: `SqliteConnector`, `SqliteBackend`, `SqliteJournalPoller`, `SqliteObservableTable`, `SqliteTablesEntitiesMap`, `SqliteLiveUpdatesRegistry`, `installSqliteTriggers`, `processSqliteEntities`.

### Trade-offs

- Update latency = poll interval (~250 ms) instead of push — fine for UI observability.
- One journal insert per write (trigger overhead) + periodic pruning.
- Triggers on tables owned by another tool (mastra) are additive and safe, but its migrations dropping/recreating tables silently remove them — mitigated by the idempotent bootstrap on every boot, and worth a startup verification log.

### Testing

Trivially self-contained — no embedded server, no binaries: a **temp-file** database (`:memory:` is per-connection and cannot exercise the cross-process path) plus a second raw connection acting as the "external writer" proves the journal pipeline end to end. The integration harness is the cheapest of all three adapters.

### Effort

~2–3 days using the postgres repo as template (scaffolding, suite conventions, and the query-translation layer all reuse).

## Relation to consuming apps

- **systools-server (SYSEDA-19106):** this design supersedes that plan's custom `pg-subscribe` websocket message type — with the library route, clients send the ordinary `subscribe` message and the app just registers PG entities alongside mongoose models. The app-side plan's Phases 1–2 (MikroORM config, trigger bootstrap) carry over as-is; its `PgCollectionStore`/listener work moves into this package.
- **Client applications:** no changes whatsoever — same socket, same messages, same payload shapes (`update`/`increment`/`total`/`delete`, `_<target>Count`, etc.).
