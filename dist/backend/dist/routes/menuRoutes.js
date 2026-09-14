"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const menuController_1 = require("../controllers/menuController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(authMiddleware_1.authenticate);
// User accessible routes
router.get('/my-menus', menuController_1.getMyMenus);
router.get('/check-access', menuController_1.checkMenuAccess);
// Superadmin Management routes
router.get('/', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), menuController_1.getAllMenus);
router.post('/', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), menuController_1.createMenu);
router.put('/:id', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), menuController_1.updateMenu);
router.delete('/:id', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), menuController_1.deleteMenu);
router.patch('/:id/status', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), menuController_1.toggleMenuStatus);
router.post('/permissions', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), menuController_1.updateRoleMenuPermissions);
exports.default = router;
