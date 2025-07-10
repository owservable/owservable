![owservable](https://avatars0.githubusercontent.com/u/87773159?s=75)

# Owservable

A reactive backend library for Node.js applications that provides real-time MongoDB change streams, reactive data stores, and automated task scheduling. Built with RxJS and TypeScript.

**Owservable is a replacement for [Reactive Stack JS](https://github.com/reactive-stack-js).**

## 🚀 Features

- **Real-time MongoDB Integration**: MongoDB change streams with reactive observables
- **Reactive Data Stores**: Count, Document, and Collection stores with automatic updates
- **WebSocket Client Management**: Built-in client connection and subscription handling
- **Task Scheduling**: Automated cronjobs, watchers, and workers
- **Action Pattern**: Structured business logic with multiple execution contexts
- **Data Middleware**: Transform and filter data based on user permissions
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## 📦 Installation

```bash
npm install owservable
```

or

```bash
yarn add owservable
```

or

```bash
pnpm add owservable
```

## 🏗️ Requirements

- **Node.js**: >= 20
- **MongoDB**: >= 3.6 (Replica Set required for change streams)
- **TypeScript**: Recommended for full type safety

## 🔧 MongoDB Setup

Owservable requires MongoDB to be running as a Replica Set to enable change streams:

```bash
# Start MongoDB as a single-node replica set
mongod --replSet rs0

# Initialize the replica set
mongo --eval "rs.initiate()"
```

For more details, see: [MongoDB Change Streams on localhost with Node.js](http://stojadinovic.net/2020/07/05/mongodb-change-streams-on-localhost-with-nodejs/)

## 🚀 Quick Start

### 1. Basic Server Setup

```typescript
import { 
  OwservableClient, 
  MongoDBConnector, 
  processModels,
  IConnectionManager 
} from 'owservable';

// Initialize MongoDB connection
const mongoConnector = new MongoDBConnector();
await mongoConnector.connect('mongodb://localhost:27017/myapp');

// Process your Mongoose models
await processModels('./models');

// Implement connection manager
class MyConnectionManager implements IConnectionManager {
  async connected(jwt: string): Promise<void> {
    // Handle client connection
  }
  
  async disconnected(): Promise<void> {
    // Handle client disconnection
  }
  
  async checkSession(): Promise<any> {
    // Handle session validation
    return { refresh_in: 300000 };
  }
  
  ping(ms: number): void {
    // Handle ping updates
  }
  
  location(path: string): void {
    // Handle location updates
  }
  
  get user(): any {
    // Return current user
    return this.currentUser;
  }
}

// Create owservable client
const connectionManager = new MyConnectionManager();
const client = new OwservableClient(connectionManager);

// Handle client messages
client.subscribe({
  next: (message) => {
    // Forward to WebSocket clients
    websocket.send(JSON.stringify(message));
  },
  error: (error) => console.error('Client error:', error)
});
```

### 2. WebSocket Integration

```typescript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  const client = new OwservableClient(connectionManager);
  
  // Subscribe to client updates
  client.subscribe({
    next: (message) => ws.send(JSON.stringify(message)),
    error: (error) => console.error('Error:', error)
  });
  
  // Handle incoming messages
  ws.on('message', async (data) => {
    const message = JSON.parse(data.toString());
    await client.consume(message);
  });
  
  // Handle disconnect
  ws.on('close', () => {
    client.disconnected();
  });
  
  // Start ping
  client.ping();
});
```

### 3. Reactive Data Stores

```typescript
import { storeFactory, EStoreType } from 'owservable';

// Count store - returns only document count
const countStore = storeFactory(EStoreType.COUNT, 'users', 'user-count');
countStore.config = {
  query: { active: true },
  fields: {}
};

// Collection store - returns array of documents
const collectionStore = storeFactory(EStoreType.COLLECTION, 'users', 'user-list');
collectionStore.config = {
  query: { active: true },
  fields: { name: 1, email: 1 },
  sort: { name: 1 },
  page: 1,
  pageSize: 10
};

// Document store - returns single document
const documentStore = storeFactory(EStoreType.DOCUMENT, 'users', 'user-profile');
documentStore.config = {
  query: { _id: 'user123' },
  fields: { name: 1, email: 1, profile: 1 }
};
```

### 4. Task Scheduling

```typescript
import { 
  initiateCronjobs, 
  initiateWatchers, 
  initiateWorkers 
} from 'owservable';

// Initialize cronjobs
await initiateCronjobs('./cronjobs');

// Initialize file watchers
await initiateWatchers('./watchers');

// Initialize background workers
await initiateWorkers('./workers');
```

### 5. Data Middleware

```typescript
import { DataMiddlewareMap } from 'owservable';

// Register middleware for collection
DataMiddlewareMap.set('users', async (payload, user) => {
  // Filter sensitive data based on user permissions
  if (!user.isAdmin) {
    payload.data = payload.data.map(doc => ({
      ...doc,
      email: '***@***.***' // Hide emails for non-admins
    }));
  }
  return payload;
});
```

## 📚 Core Components

### OwservableClient

The main client class that manages WebSocket connections and subscriptions:

```typescript
const client = new OwservableClient(connectionManager);

// Handle different message types
await client.consume({
  type: 'subscribe',
  target: 'user-list',
  scope: 'collection',
  observe: 'users',
  config: {
    query: { active: true },
    fields: { name: 1, email: 1 }
  }
});
```

### Store Types

#### CollectionStore
Returns arrays of documents with real-time updates:

```typescript
const store = storeFactory(EStoreType.COLLECTION, 'posts', 'post-list');
store.config = {
  query: { published: true },
  fields: { title: 1, content: 1, author: 1 },
  sort: { createdAt: -1 },
  populate: ['author'],
  page: 1,
  pageSize: 20,
  incremental: true // Enable incremental updates
};
```

#### CountStore
Returns document counts with real-time updates:

```typescript
const store = storeFactory(EStoreType.COUNT, 'users', 'user-count');
store.config = {
  query: { active: true }
};
```

#### DocumentStore
Returns single documents with real-time updates:

```typescript
const store = storeFactory(EStoreType.DOCUMENT, 'users', 'current-user');
store.config = {
  query: { _id: userId },
  fields: { name: 1, email: 1, preferences: 1 }
};
```

### MongoDB Integration

#### Observable Models
Monitor MongoDB collections for changes:

```typescript
import { observableModel } from 'owservable';
import UserModel from './models/User';

const userObservable = observableModel(UserModel);
userObservable.subscribe({
  next: (change) => {
    console.log('User collection changed:', change);
  }
});
```

#### Observable Database
Monitor entire database for changes:

```typescript
import { observableDatabase } from 'owservable';

const dbObservable = observableDatabase();
dbObservable.subscribe({
  next: (change) => {
    console.log('Database changed:', change);
  }
});
```

### Action Pattern

Create structured business logic with the action pattern:

```typescript
import { Action, ActionInterface } from 'owservable';

class SendEmailAction extends Action implements ActionInterface {
  protected _description = 'Send email notification';
  
  async handle(to: string, subject: string, body: string): Promise<void> {
    // Email sending logic
    console.log(`Sending email to ${to}: ${subject}`);
  }
  
  description(): string {
    return this._description;
  }
}

// Use in cronjobs, workers, or watchers
const emailAction = new SendEmailAction();
await emailAction.handle('user@example.com', 'Welcome!', 'Hello World');
```

## 🔧 Configuration

### Environment Variables

```bash
# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/myapp

# WebSocket server
WS_PORT=8080

# JWT settings
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## 📖 Advanced Usage

### Custom Store Implementation

```typescript
import { AStore, EStoreType } from 'owservable';

class CustomStore extends AStore {
  constructor(model: Model<any>, target: string) {
    super(model, target);
    this._type = EStoreType.COLLECTION;
  }
  
  protected async load(change: any): Promise<void> {
    // Custom loading logic
    const data = await this.customQuery();
    this.emitMany(Date.now(), this._subscriptionId, { data });
  }
}
```

### Performance Optimization

```typescript
// Use incremental updates for large collections
store.config = {
  incremental: true,
  page: 1,
  pageSize: 50
};

// Optimize queries with indexes
await addIndexToAttributes(model, ['field1', 'field2']);

// Use field projection
store.config = {
  fields: { 
    name: 1, 
    email: 1,
    _id: 0 // Exclude _id
  }
};
```

## 🧪 Testing

```bash
npm test
```

## 📖 Documentation

- **Main Website**: [owservable.github.io](https://owservable.github.io/)
- **TypeDoc Documentation**: [owservable.github.io/owservable/docs/](https://owservable.github.io/owservable/docs/)
- **Test Coverage**: [owservable.github.io/owservable/coverage/](https://owservable.github.io/owservable/coverage/)
- **Udemy Course**: [Reactive Stack Course](https://www.udemy.com/course/reactive-stack/)

## 🔗 Related Projects

- [@owservable/actions](https://github.com/owservable/actions) - Action pattern implementation
- [@owservable/folders](https://github.com/owservable/folders) - File system utilities
- [@owservable/fastify-auto-routes](https://github.com/owservable/fastify-auto-routes) - Fastify auto routing

## 🛣️ Roadmap

- [ ] Web Server abstraction
- [ ] Database abstraction
- [ ] Client-side datastore abstraction
- [ ] Large Data handling
- [ ] Server-Side Events
- [ ] Redis integration
- [ ] GraphQL subscriptions
- [ ] Microservices support

## 📄 License

Licensed under [The Unlicense](./LICENSE).

## 🤝 Contributors

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

## 📊 UML Diagram

Checkout the [UML diagram](https://raw.githubusercontent.com/owservable/owservable/main/uml.png) for a visual overview of the architecture.
