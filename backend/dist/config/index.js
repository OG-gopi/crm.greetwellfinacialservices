"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
dotenv_1.default.config();
const isVercel = !!(process.env.VERCEL || process.env.NOW_BUILD || process.env.CI);
const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const defaultAppUrl = process.env.APP_URL || (vercelDomain ? `https://${vercelDomain}` : 'http://localhost:3001');
const defaultApiUrl = process.env.API_URL || (vercelDomain ? `https://${vercelDomain}/api` : 'http://localhost:5000/api');
exports.CONFIG = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    JWT_SECRET: process.env.JWT_SECRET || 'greetwell_financial_super_secret_jwt_key_2026_prod',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    APP_URL: defaultAppUrl,
    API_URL: defaultApiUrl,
    UPLOAD_DIR: isVercel ? path_1.default.join(os_1.default.tmpdir(), 'uploads') : path_1.default.resolve(__dirname, '../../uploads'),
    MAX_FILE_SIZE: (parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10)) * 1024 * 1024,
    SMTP: {
        HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
        PORT: parseInt(process.env.SMTP_PORT || '465', 10),
        USER: process.env.GMAIL_USER || process.env.SMTP_USER || 'greetwell.notify@gmail.com',
        PASS: process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD || '',
        FROM: process.env.FROM_EMAIL || 'Greetwell Financial Services <greetwell.notify@gmail.com>',
    },
};
