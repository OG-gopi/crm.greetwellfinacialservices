"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const systemController_1 = require("../controllers/systemController");
const emailLogController_1 = require("../controllers/emailLogController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.get('/email-templates', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), systemController_1.getEmailTemplates);
router.post('/email-templates', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), systemController_1.createEmailTemplate);
router.get('/fields', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), systemController_1.getCustomFields);
router.post('/fields', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), systemController_1.createCustomField);
router.get('/backups', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), systemController_1.getBackupHistory);
router.post('/backups/trigger', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), systemController_1.triggerBackup);
// Super Admin Email Delivery Audit & Retry Routes
router.get('/email-logs', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), emailLogController_1.getEmailLogs);
router.post('/email-logs/:id/retry', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), emailLogController_1.retryEmail);
router.post('/email-logs/test-send', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), emailLogController_1.sendTestEmail);
exports.default = router;
