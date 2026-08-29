import { Router } from 'express';
import { ReminderController } from '../controllers/reminder.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/', ReminderController.getReminders);

export default router;
