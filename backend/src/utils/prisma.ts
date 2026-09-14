import { PrismaClient } from '@prisma/client';

const isVercel = !!(process.env.VERCEL || process.env.NOW_BUILD || process.env.CI);
const isProduction = process.env.NODE_ENV === 'production' || isVercel;

const directSupabaseUrl = 'postgresql://postgres:7893220502%40Gopi@db.wthrxtouwlhjwcfnhkgo.supabase.co:5432/postgres';

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('pooler.supabase.com') || process.env.DATABASE_URL.includes('localhost')) {
  if (isProduction || process.env.DATABASE_URL?.includes('pooler.supabase.com')) {
    console.log('Using direct Supabase PostgreSQL URL fallback');
    process.env.DATABASE_URL = directSupabaseUrl;
    process.env.DIRECT_URL = directSupabaseUrl;
  }
}

if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});
