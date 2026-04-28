import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, afterEach, beforeAll } from 'vitest';

let mongoServer: MongoMemoryServer | null = null;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      ip: '127.0.0.1',
      port: 29017,
      dbName: 'app-chat-test-db',
    },
  });
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
});
