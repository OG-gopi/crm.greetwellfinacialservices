import { Router } from 'express';
import { getEmailTemplates, createEmailTemplate, getCustomFields, createCustomField, triggerBackup, getBackupHistory } from '../controllers/systemController';
import { getEmailLogs, retryEmail, sendTestEmail } from '../controllers/emailLogController';
import { authenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/email-templates', requireRole('SUPER_ADMIN'), getEmailTemplates);
router.post('/email-templates', requireRole('SUPER_ADMIN'), createEmailTemplate);

router.get('/fields', requireRole('SUPER_ADMIN'), getCustomFields);
router.post('/fields', requireRole('SUPER_ADMIN'), createCustomField);

router.get('/backups', requireRole('SUPER_ADMIN'), getBackupHistory);
router.post('/backups/trigger', requireRole('SUPER_ADMIN'), triggerBackup);

// Super Admin Email Delivery Audit & Retry Routes
router.get('/email-logs', requireRole('SUPER_ADMIN'), getEmailLogs);
router.post('/email-logs/:id/retry', requireRole('SUPER_ADMIN'), retryEmail);
router.post('/email-logs/test-send', requireRole('SUPER_ADMIN'), sendTestEmail);

export default router;
