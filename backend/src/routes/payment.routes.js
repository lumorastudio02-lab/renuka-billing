import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { createPaymentSchema, updatePaymentSchema } from '../validators/payment.validator.js';

const router = Router();

router.use(authenticate);
router.get('/', PaymentController.getAllPayments);
router.get('/next-receipt', PaymentController.getNextReceiptNo);
router.post('/', validate(createPaymentSchema), PaymentController.addPayment);
router.put('/:id', validate(updatePaymentSchema), PaymentController.updatePayment);
router.delete('/:id', PaymentController.deletePayment);

export default router;
