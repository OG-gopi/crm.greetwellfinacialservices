"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const permissionController_1 = require("../controllers/permissionController");
const methodPermissionController_1 = require("../controllers/methodPermissionController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
// Roles
router.get('/roles', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), permissionController_1.getRoles);
router.post('/roles', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), permissionController_1.createRole);
// Method Permissions
router.get('/methods', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), methodPermissionController_1.getAllMethodPermissions);
router.post('/methods', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), methodPermissionController_1.createMethodPermission);
router.put('/methods/:id', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), methodPermissionController_1.updateMethodPermission);
router.delete('/methods/:id', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), methodPermissionController_1.deleteMethodPermission);
router.patch('/methods/:id/status', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), methodPermissionController_1.toggleMethodPermissionStatus);
// Permission Groups
router.get('/groups', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), permissionController_1.getPermissionGroups);
exports.default = router;
