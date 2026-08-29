import { Router } from 'express';
import { SettingController } from '../controllers/setting.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { updateSettingSchema } from '../validators/setting.validator.js';

const router = Router();

router.use(authenticate);
router.get('/', SettingController.getSettings);
router.put('/', validate(updateSettingSchema), SettingController.updateSettings);

export default router;
