"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.getPrisma = getPrisma;
const client_1 = require("@prisma/client");
let prismaInstance = null;
function formatSupabaseUrl(url) {
    if (!url || typeof url !== 'string')
        return url;
    let formatted = url.trim();
    // Convert pooler port 5432 to 6543 for transaction pooling mode
    if (formatted.includes('.pooler.supabase.com:5432')) {
        formatted = formatted.replace('.pooler.supabase.com:5432', '.pooler.supabase.com:6543');
    }
    // Ensure pgbouncer, connection_limit=10 and pool_timeout=30 are set for serverless pooled mode
    if (formatted.includes('.pooler.supabase.com') || formatted.includes('supabase.co')) {
        if (!formatted.includes('pgbouncer=true')) {
            const sep = formatted.includes('?') ? '&' : '?';
            formatted += `${sep}pgbouncer=true`;
        }
        if (!formatted.includes('connection_limit=')) {
            const sep = formatted.includes('?') ? '&' : '?';
            formatted += `${sep}connection_limit=10`;
        }
        else {
            formatted = formatted.replace(/connection_limit=\d+/, 'connection_limit=10');
        }
        if (!formatted.includes('pool_timeout=')) {
            const sep = formatted.includes('?') ? '&' : '?';
            formatted += `${sep}pool_timeout=30`;
        }
    }
    return formatted;
}
function getPrisma() {
    if (!prismaInstance) {
        const rawFallbackUrl = 'postgresql://postgres.wthrxtouwlhjwcfnhkgo:7893220502%40gfs@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=30';
        const rawUrl = (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '' && !process.env.DATABASE_URL.includes('localhost'))
            ? process.env.DATABASE_URL
            : rawFallbackUrl;
        const activeUrl = formatSupabaseUrl(rawUrl);
        process.env.DATABASE_URL = activeUrl;
        process.env.DIRECT_URL = activeUrl;
        prismaInstance = new client_1.PrismaClient({
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
exports.prisma = new Proxy({}, {
    get(target, prop) {
        const client = getPrisma();
        const value = client[prop];
        if (typeof value === 'function') {
            return value.bind(client);
        }
        return value;
    },
});
