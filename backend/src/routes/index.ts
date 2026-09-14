import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import applicationRoutes from './applicationRoutes';
import documentRoutes from './documentRoutes';
import taskRoutes from './taskRoutes';
import noteRoutes from './noteRoutes';
import notificationRoutes from './notificationRoutes';
import auditRoutes from './auditRoutes';
import productRoutes from './productRoutes';
import settingRoutes from './settingRoutes';
import dashboardRoutes from './dashboardRoutes';
import enquiryRoutes from './enquiryRoutes';
import updateRoutes from './updateRoutes';
import reportRoutes from './reportRoutes';
import systemRoutes from './systemRoutes';
import permissionRoutes from './permissionRoutes';
import menuRoutes from './menuRoutes';
import websiteRoutes from './websiteRoutes';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/applications', applicationRoutes);
router.use('/documents', documentRoutes);
router.use('/tasks', taskRoutes);
router.use('/notes', noteRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/products', productRoutes);
router.use('/settings', settingRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/enquiries', enquiryRoutes);
router.use('/updates', updateRoutes);
router.use('/reports', reportRoutes);
router.use('/system', systemRoutes);
router.use('/permissions', permissionRoutes);
router.use('/menus', menuRoutes);
router.use('/website', websiteRoutes);

export default router;

