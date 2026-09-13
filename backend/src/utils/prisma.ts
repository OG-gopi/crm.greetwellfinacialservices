import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ [PRISMA WARNING] DATABASE_URL is missing. Setting fallback PostgreSQL connection string.');
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/greetwell_db?schema=public';
}
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});
