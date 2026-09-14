"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const websiteController_1 = require("../controllers/websiteController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Public route (no authentication required)
router.get('/public', websiteController_1.getPublicWebsiteContent);
// Super Admin only management routes
router.get('/admin', authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), websiteController_1.getAdminWebsiteContent);
router.post('/admin/draft', authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), websiteController_1.saveWebsiteDraft);
router.post('/admin/publish', authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), websiteController_1.publishWebsiteChanges);
router.post('/admin/discard', authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), websiteController_1.discardWebsiteDraft);
router.get('/admin/history', authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), websiteController_1.getWebsiteChangeHistory);
// Super Admin Media Management routes
router.post('/admin/upload-image', authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), websiteController_1.mediaUploadMiddleware.single('image'), websiteController_1.uploadWebsiteImage);
router.post('/admin/media', authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), websiteController_1.createWebsiteMedia);
router.put('/admin/media/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), websiteController_1.updateWebsiteMedia);
router.delete('/admin/media/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), websiteController_1.deleteWebsiteMedia);
exports.default = router;
