"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
    console.error('💥 Unhandled Error:', err);
    // Catch database connection / missing file errors gracefully
    if (err?.message &&
        (err.message.includes('Unable to open the database file') ||
            err.message.includes('Can\'t reach database server') ||
            err.message.includes('Error code 14') ||
            err?.code === 'P1001' ||
            err?.code === 'P1003')) {
        return res.status(503).json({
            success: false,
            message: 'Database connection unavailable. Please ensure DATABASE_URL and DIRECT_URL are configured in Vercel environment settings.',
        });
    }
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error occurred.';
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    });
}
