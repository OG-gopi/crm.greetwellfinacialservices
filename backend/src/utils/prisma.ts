import { PrismaClient } from '@prisma/client';

const isVercel = !!(process.env.VERCEL || process.env.NOW_BUILD || process.env.CI);
const isProduction = process.env.NODE_ENV === 'production' || isVercel;

if (!process.env.DATABASE_URL) {
  if (!isProduction) {
    process.env.DATABASE_URL = 'file:./dev.db';
  } else {
    console.warn('DATABASE_URL is not set in environment variables. Setting default fallback.');
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/greetwell_crm?schema=public';
  }
}

if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});
