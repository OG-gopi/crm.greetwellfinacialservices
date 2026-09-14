"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const applicationController_1 = require("../controllers/applicationController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.get('/', (0, authMiddleware_1.requirePermission)('applications.view'), applicationController_1.getApplications);
router.get('/:id', (0, authMiddleware_1.requirePermission)('applications.view'), applicationController_1.getApplicationById);
router.post('/', (0, authMiddleware_1.requirePermission)('applications.create'), applicationController_1.createApplication);
router.put('/:id/assign', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), applicationController_1.assignApplication);
router.put('/:id/status', (0, authMiddleware_1.requirePermission)('applications.edit'), applicationController_1.updateApplicationStatus);
router.post('/:id/verify', (0, authMiddleware_1.requirePermission)('applications.verify'), applicationController_1.verifyApplicationData);
// Customer & Agent Requests / Requirements
router.post('/:id/requests', applicationController_1.createApplicationRequest);
router.post('/requests/:requestId/reply', applicationController_1.replyToApplicationRequest);
router.put('/requests/:requestId/status', applicationController_1.updateRequestStatus);
exports.default = router;
