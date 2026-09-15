import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

function formatSupabaseUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;

  let formatted = url.trim();

  // Convert pooler port 5432 to 6543 for transaction pooling mode
  if (formatted.includes('.pooler.supabase.com:5432')) {
    formatted = formatted.replace('.pooler.supabase.com:5432', '.pooler.supabase.com:6543');
  }

  // Ensure pgbouncer and connection_limit=1 are set for serverless pooled mode
  if (formatted.includes('.pooler.supabase.com') || formatted.includes('supabase.co')) {
    if (!formatted.includes('pgbouncer=true')) {
      const sep = formatted.includes('?') ? '&' : '?';
      formatted += `${sep}pgbouncer=true`;
    }
    if (!formatted.includes('connection_limit=')) {
      const sep = formatted.includes('?') ? '&' : '?';
      formatted += `${sep}connection_limit=1`;
    }
  }

  return formatted;
}

export function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    const rawFallbackUrl = 'postgresql://postgres.wthrxtouwlhjwcfnhkgo:7893220502%40gfs@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1';
    
    const rawUrl = (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '' && !process.env.DATABASE_URL.includes('localhost'))
      ? process.env.DATABASE_URL
      : rawFallbackUrl;

    const activeUrl = formatSupabaseUrl(rawUrl);

    process.env.DATABASE_URL = activeUrl;
    process.env.DIRECT_URL = activeUrl;

    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: activeUrl,
        },
      },
      log: ['error'],
    });
  }
  return prismaInstance;
}

// Proxy wrapper prevents top-level instantiation crashes during serverless module loading
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getPrisma();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
