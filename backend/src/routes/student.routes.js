import { Router } from 'express';
import { StudentController } from '../controllers/student.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { createStudentSchema } from '../validators/student.validator.js';

const router = Router();

router.use(authenticate);
router.get('/', StudentController.getAllStudents);
router.get('/next-id', StudentController.getNextId);
router.get('/export', StudentController.exportCSV);
router.post('/', validate(createStudentSchema), StudentController.saveStudent);
router.delete('/:id', StudentController.deleteStudent);

export default router;
