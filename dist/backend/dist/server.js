"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const server = app_1.default.listen(config_1.CONFIG.PORT, () => {
    console.log(`🚀 Financial Portal Backend Server running on port ${config_1.CONFIG.PORT} in ${config_1.CONFIG.NODE_ENV} mode.`);
    console.log(`📡 API Base URL: ${config_1.CONFIG.API_URL}/api`);
});
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
});
