import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

router.use(authenticate);
router.post('/logo', upload.single('logo'), UploadController.uploadFile);
router.post('/document', upload.single('document'), UploadController.uploadFile);

export default router;
