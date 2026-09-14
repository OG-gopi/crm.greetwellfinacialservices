"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditController_1 = require("../controllers/auditController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.get('/', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), (0, authMiddleware_1.requirePermission)('audit_logs.view'), auditController_1.getAuditLogs);
exports.default = router;
