import dotenv from 'dotenv';
import path from 'path';
import os from 'os';

dotenv.config();

const isVercel = !!(process.env.VERCEL || process.env.NOW_BUILD || process.env.CI);
const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const defaultFrontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' || vercelDomain ? 'https://crm-greetwellfinacialservicescrmg.vercel.app' : 'http://localhost:3000');
const defaultAppUrl = process.env.APP_URL || defaultFrontendUrl;
const defaultApiUrl = process.env.API_URL || (vercelDomain ? `https://${vercelDomain}/api` : 'http://localhost:5000/api');

export const CONFIG = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'greetwell_financial_super_secret_jwt_key_2026_prod',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FRONTEND_URL: defaultFrontendUrl,
  APP_URL: defaultAppUrl,
  API_URL: defaultApiUrl,
  UPLOAD_DIR: isVercel ? path.join(os.tmpdir(), 'uploads') : path.resolve(__dirname, '../../uploads'),
  MAX_FILE_SIZE: (parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10)) * 1024 * 1024,
  SMTP: {
    HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    PORT: parseInt(process.env.SMTP_PORT || '465', 10),
    USER: process.env.GMAIL_USER || process.env.SMTP_USER || 'greetwell.notify@gmail.com',
    PASS: process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD || '',
    FROM: process.env.FROM_EMAIL || 'Greetwell Financial Services <greetwell.notify@gmail.com>',
  },
};
