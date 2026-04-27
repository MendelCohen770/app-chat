import { existsSync } from 'node:fs';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_for_jwt_12345';
process.env.DB_CONNECTION = process.env.DB_CONNECTION || 'mongodb://127.0.0.1:27017/test-db';
process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-google-client-id';
process.env.EMAIL = process.env.EMAIL || 'test@example.com';
process.env.EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || 'test-password';
process.env.MONGOMS_DOWNLOAD_DIR =
  process.env.MONGOMS_DOWNLOAD_DIR || `${process.cwd()}/.cache/mongodb-binaries`;

const localMongoBinary = '/Users/ella/mongodb-macos-x86_64-7.0.31/bin/mongod';
if (!process.env.MONGOMS_SYSTEM_BINARY && existsSync(localMongoBinary)) {
  process.env.MONGOMS_SYSTEM_BINARY = localMongoBinary;
}
