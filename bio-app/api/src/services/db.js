const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
  quiet: true,
});

const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const { PrismaClient } = require('@prisma/client');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured. Copy api/.env.example to api/.env and set your database connection string.');
}
const adapter = new PrismaMariaDb(databaseUrl);
const prisma = new PrismaClient({ adapter });

let initPromise;

async function initDatabase() {
  if (!initPromise) {
    initPromise = prisma.$connect();
  }

  return initPromise;
}

module.exports = {
  initDatabase,
  prisma,
};
