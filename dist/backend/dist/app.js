"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const config_1 = require("./config");
const app = (0, express_1.default)();
// Configure explicit CORS for deployed frontend domain and local development
const allowedOrigins = [
    'https://crmgreetwellfinacialservices.vercel.app',
    'https://crm-greetwellfinacialservicescrm.vercel.app',
    'https://crm-greetwellfinacialservices.vercel.app',
    'http://localhost:3001',
    'http://localhost:5000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5000',
];
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin) || (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.split(',').includes(origin))) {
            return callback(null, true);
        }
        if (origin.endsWith('.vercel.app') || process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};
app.use((0, cors_1.default)(corsOptions));
app.options('*', (0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve uploaded files statically with automatic sample document fallback
app.use('/uploads', express_1.default.static(config_1.CONFIG.UPLOAD_DIR));
app.use('/uploads', (req, res) => {
    const defaultSamplePath = path_1.default.join(config_1.CONFIG.UPLOAD_DIR, 'default_sample.pdf');
    if (fs_1.default.existsSync(defaultSamplePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        return res.sendFile(defaultSamplePath);
    }
    return res.status(404).send('Document not found');
});
// Health check endpoints (both /health and /api/health)
app.get(['/health', '/api/health'], (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API Routes (mounted on both /api and root for Vercel serverless rewrite resilience)
app.use('/api', routes_1.default);
app.use('/', routes_1.default);
// Serve frontend static build if available
const frontendDistPath = path_1.default.resolve(__dirname, '../../frontend/dist');
app.use(express_1.default.static(frontendDistPath));
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/health')) {
        return next();
    }
    const indexPath = path_1.default.join(frontendDistPath, 'index.html');
    if (fs_1.default.existsSync(indexPath)) {
        return res.sendFile(indexPath);
    }
    next();
});
// Centralized error handler
app.use(errorHandler_1.errorHandler);
exports.default = app;
