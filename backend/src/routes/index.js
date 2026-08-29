import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import studentRoutes from './student.routes.js';
import paymentRoutes from './payment.routes.js';
import expenseRoutes from './expense.routes.js';
import settingRoutes from './setting.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import reminderRoutes from './reminder.routes.js';
import uploadRoutes from './upload.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/students', studentRoutes);
router.use('/payments', paymentRoutes);
router.use('/expenses', expenseRoutes);
router.use('/settings', settingRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reminders', reminderRoutes);
router.use('/upload', uploadRoutes);
router.use('/notifications', notificationRoutes);

export default router;
