import { z } from 'zod';

export const createPaymentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  amount: z.number().positive('Amount must be greater than zero'),
  date: z.string().min(1, 'Payment date is required'),
  mode: z.enum(['Cash', 'UPI', 'Bank Transfer']),
  upiReference: z.string().optional().or(z.literal('')),
  nextDueDate: z.string().optional().or(z.literal('')),
});

export const updatePaymentSchema = z.object({
  id: z.string().optional(),
  studentId: z.string().min(1, 'Student ID is required'),
  amount: z.number().min(0, 'Amount must be a non-negative number'),
  date: z.string().min(1, 'Payment date is required'),
  mode: z.enum(['Cash', 'UPI', 'Bank Transfer']),
  upiReference: z.string().optional().or(z.literal('')),
  nextDueDate: z.string().optional().or(z.literal('')),
});
