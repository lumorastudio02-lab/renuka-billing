import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { createExpenseSchema } from '../validators/expense.validator.js';

const router = Router();

router.use(authenticate);
router.get('/', ExpenseController.getAllExpenses);
router.post('/', validate(createExpenseSchema), ExpenseController.saveExpense);
router.delete('/:id', ExpenseController.deleteExpense);

export default router;
