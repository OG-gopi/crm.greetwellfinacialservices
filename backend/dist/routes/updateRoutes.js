"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const updateController_1 = require("../controllers/updateController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Public endpoint (accessible by login, register, website without token)
router.get('/public-version', updateController_1.getPublicVersion);
// Protected endpoints
router.use(authMiddleware_1.authenticate);
router.get('/release-notes', updateController_1.getReleaseNotes);
router.post('/release-notes', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), updateController_1.createReleaseNote);
router.put('/release-notes/:id', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), updateController_1.updateReleaseNote);
router.delete('/release-notes/:id', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), updateController_1.deleteReleaseNote);
router.put('/version', (0, authMiddleware_1.requireRole)('SUPER_ADMIN'), updateController_1.updateSystemVersion);
exports.default = router;
