import { PrismaClient } from '@prisma/client';

const isVercel = !!(process.env.VERCEL || process.env.NOW_BUILD || process.env.CI);
const isProduction = process.env.NODE_ENV === 'production' || isVercel;

if (!isProduction) {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost:5432') || process.env.DATABASE_URL.includes('127.0.0.1:5432')) {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')) {
      process.env.DATABASE_URL = 'file:./dev.db';
    }
  }
}

if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});
