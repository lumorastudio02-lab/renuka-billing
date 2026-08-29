import { z } from 'zod';

export const createStudentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Student name is required'),
  mobile: z.string().min(5, 'Mobile number is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  course: z.string().min(1, 'Course is required'),
  batch: z.string().min(1, 'Batch is required'),
  admissionDate: z.string().min(1, 'Admission date is required'),
  instalmentDate: z.string().optional().or(z.literal('')),
  totalFee: z.number().min(0, 'Total course fee must be greater than or equal to 0'),
  paidFee: z.number().min(0, 'Paid fee must be greater than or equal to 0').optional().default(0),
  nextDueDate: z.string().optional().or(z.literal('')),
});

export const updateStudentSchema = createStudentSchema.partial();
