import { z } from 'zod';

export const createExpenseSchema = z.object({
  title: z.string().min(1, 'Expense title is required'),
  amount: z.number().min(0, 'Amount must be a non-negative number'),
  date: z.string().min(1, 'Expense date is required'),
  category: z.enum(['Utilities', 'Salary', 'Rent', 'Supplies', 'Marketing', 'Travel', 'Other']).default('Other'),
  note: z.string().optional().or(z.literal('')),
});

export const updateExpenseSchema = createExpenseSchema.partial();
