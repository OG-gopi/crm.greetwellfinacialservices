import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost:5432') || process.env.DATABASE_URL.includes('127.0.0.1:5432')) {
  // If no working remote PostgreSQL URL is provided, fallback to local dev.db for offline zero-config dev
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('postgresql://postgres.')) {
    process.env.DATABASE_URL = 'file:./dev.db';
  }
}
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});
