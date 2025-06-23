import express from 'express';
import RequestLogger from 'morgan';
import Cors from 'cors';
import { WebSocketServer } from 'ws';
import { ApolloServer } from 'apollo-server-express';
import { gql } from 'apollo-server-core';
import { getServerStatus } from './apiFunctions.js';

const app = express();
app.use(RequestLogger('dev'));
app.use(Cors());

// Apollo GraphQL setup
const typeDefs = gql`
  type StatusResponse {
    status: String
  }

  type Query {
    getServerStatus: StatusResponse
  }
`;
const resolvers = {
  Query: {
    getServerStatus: () => {
      return { status: 'Triggered WebSocket message' };
    }
  }
};
const apolloServer = new ApolloServer({ typeDefs, resolvers });

// Start ApolloServer before applying middleware
async function start() {
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  // ✅ Start Express and capture the server
  const server = app.listen(8080, () => {
    console.log('🚀 Server ready at http://localhost:8080');
    console.log(`🚀 GraphQL at http://localhost:8080${apolloServer.graphqlPath}`);
  });

  // ✅ Use the server for WebSocket
  const wss = new WebSocketServer({ server });
  app.set('wss', wss);

  wss.on('connection', (ws) => {
    console.log('WebSocket connected');

    ws.on('message', (message) => {
      try {
        const decoded = JSON.parse(message.toString());
        if (decoded.type === 'auth' && decoded.userId) {
          ws.userId = decoded.userId;
          console.log('verified:', ws.userId);
        }
        console.log('Decoded message:', decoded);
        ws.send('Hello from server');
      } catch (err) {
        console.error('Invalid message', err);
      }
    });

    ws.on('close', () => {
      console.log(`Client ${ws.userId || 'unknown'} disconnected`);
    });
  });

  // REST route example
  app.get('/connect', getServerStatus);
}
start();
process.on('unhandledRejection', error => {
    console.error('Uncaught Error', error.message);
});