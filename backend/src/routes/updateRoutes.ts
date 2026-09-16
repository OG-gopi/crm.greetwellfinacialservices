import { Router } from 'express';
import {
  getReleaseNotes,
  createReleaseNote,
  getPublicVersion,
  updateReleaseNote,
  deleteReleaseNote,
  updateSystemVersion,
} from '../controllers/updateController';
import { authenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Public endpoint (accessible by login, register, website without token)
router.get('/public-version', getPublicVersion);

// Protected endpoints
router.use(authenticate);

router.get('/release-notes', getReleaseNotes);
router.post('/release-notes', requireRole('SUPER_ADMIN'), createReleaseNote);
router.put('/release-notes/:id', requireRole('SUPER_ADMIN'), updateReleaseNote);
router.delete('/release-notes/:id', requireRole('SUPER_ADMIN'), deleteReleaseNote);
router.put('/version', requireRole('SUPER_ADMIN'), updateSystemVersion);

export default router;

