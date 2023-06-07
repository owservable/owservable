![owservable](https://avatars0.githubusercontent.com/u/87773159?s=75)

# Owservable backend

[Reactive Stack JS](https://github.com/reactive-stack-js) replacement.

See <a href="https://owservable.github.io/" target="_blank">owservable.github.io</a> for more info.

Checkout my <a href="https://www.udemy.com/course/reactive-stack/" target="_blank">Reactive Stack Udemy course</a>.

## :books: Documentation

See the <a href="https://owservable.github.io/owservable/docs/" target="_blank">TypeDoc documentation</a>.

### :traffic_light: Testing:

See the <a href="https://owservable.github.io/owservable/coverage/" target="_blank">Test coverage</a>.

## :clipboard: TODOs

- Web Server abstraction
- Database abstraction
- Client-side datastore abstraction
- Larga Data handling
- Server-Side Events

## :scroll: Uses

- [Mongoose](https://mongoosejs.com)
- [RxJS](https://rxjs.dev)
- [Typescript](https://www.typescriptlang.org/)
- [Chai](https://www.chaijs.com/)
- [Mocha](https://mochajs.org/)
- [NYC](https://istanbul.js.org/)

## :floppy_disk: MongoDB Replica Set

Make sure your MongoDB database is running as a Replica Set: http://stojadinovic.net/2020/07/05/mongodb-change-streams-on-localhost-with-nodejs/

### OwservableClient

This is the main class.

It processes client subscription requests, creates appropriate stores and subscribes to them to observe changes.

It extends RxJS:Subject, so that any websocket instance can subscribe to it, in order to forward updates back to the client.

### IConnectionManager

Defines a Connection`Manager interface to be implemented by the application using this library.

This implementation is required for the above ```OwservableClient```. An instance of ```OwservableClient``` is calling ```IConnectionManager``` methods accordingly.

### DataMiddlewareMap

This is a map of all defined Data Middleware methods.

A Data Middleware is tied to a collection name and is used to modify an observed payload if necessary. For example, if based on users
access permissions a portion of the payload needs to be removed or replaced, etc.

### initiateWatchers

Method that initiates all watchers. Takes the project root folder path and a global folder name for the watchers.

Watchers can either perform simple tasks or add jobs to a queue, to be processed by the workers.

### initiateCronjobs

Method that initiates all cronjobs. Takes the project root folder path and a global folder name for the cronjobs.

Cronjobs can either perform simple tasks or add jobs to a queue, to be processed by the workers.

### initiateWorkers

Method that initiates all workers. Takes the project root folder path and a global folder name for the workers.

Workers can either perform simple tasks or take jobs from a queue.

## MongoDB

### MongoDBConnector

A MongoDB database connector class, used to initialize the database collection which Mongoose will then use.

### processModels

This method parses all models and adds them to the ```CollectionsModelsMap``` if they pass validation. The method takes the project root folder path and a global folder name for
the models and an optional folder name(
s) to exclude, for example ```mixins``` and similar.

### CollectionsModelsMap

This is a map of all Mongoose models and related MongoDB collections. It is populated automatically during the execution of ```processModels```.

### observableModel

Requires MongoDB 3.6+: This method returns an RxJS Subject that can be subscribed to and thus observe a particular MongoDB collection. This method takes a Mongoose model instance.

### observableDatabase

Requires MongoDB 4.0+: This method returns an RxJS Subject that can be subscribed to and thus observe the entire MongoDB database.

## Routes

### processFastifyBlipp

This method stores all fastify routes into the ```RoutesMap``` in order to display them on request as a form of quick routes documentation.

This method is set as ```blippLog``` options attribute during fastify registration of the ```fastify-blipp``` plugin.
Eg. ```server.register(fastifyBlipp, {blippLog: processFastifyBlipp});```.

### RoutesMap

This is a map of all available routes. It is populated automatically during the execution of ```processFastifyBlipp```.

### addFastifyRoutes

This method adds all routes to fastify automatically. It requires as parameters a fastify instance, the project root folder path and a global folder name for the routes.

### cleanRelativePath

Helper metohd used in ```addFastifyRoutes``` to generate the route path from filename and file location relative to routes root folder.

## Store

### AStore

Abstract class for ```CountStore```, ```DocumentStore``` and ```CollectionStore``` implementations.

### EStoreType

Enum for existing store types: ```COUNT | DOCUMENT | COLLECTION```.

### CountStore

Count store, observes a particular query and returns only an integer representing the count of response rows.

### DocumentStore

Document store, observes a particular query and returns all response rows.

### CollectionStore

Collection store, observes a particular query and returns all response rows.

### storeFactory

Store factory method, creates an appropriate AStore instance based on passed subscription parameters.

## Types

These types are self explanatory.

- CronJobType
- WatcherType
- WorkerType
- StoreScopeType
- StoreSubscriptionConfigType
- StoreSubscriptionUpdateType
- ConnectionManagerRefreshType

## :scroll: License

Licensed under [The Unlicense](./LICENSE).

## :sparkles: Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center">
        <a href="http://stojadinovic.net">
            <img src="https://avatars.githubusercontent.com/u/112515?v=4" width="100px;" alt=""/>
            <br />
            <sub><b>Predrag Stojadinović</b></sub>
            <br />
        </a>
        <br />
        <a href="https://github.com/owservable/owservable/commits?author=cope" title="Code">💻</a>
        <a href="https://github.com/owservable/owservable/commits?author=cope" title="Documentation">📖</a>
        <a href="https://github.com/owservable/owservable/commits?author=cope" title="Ideas & Planning">🤔</a>
        <a href="https://github.com/owservable/owservable/commits?author=cope" title="Maintenance">🚧</a>
        <a href="https://github.com/owservable/owservable/commits?author=cope" title="Project Management">📆</a>
        <a href="https://github.com/owservable/owservable/commits?author=cope" title="Tests">⚠️</a>
    </td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification.

Contributions of any kind welcome!

## :chart_with_upwards_trend: UML

Checkout the [UML diagram](https://raw.githubusercontent.com/owservable/owservable/main/uml.png).
