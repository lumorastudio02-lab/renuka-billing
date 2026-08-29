import { z } from 'zod';

export const updateSettingSchema = z.object({
  instituteName: z.string().min(1, 'Institute name is required'),
  logo: z.string().optional().or(z.literal('')),
  address: z.string().min(1, 'Address is required'),
  mobile: z.string().min(1, 'Mobile number is required'),
  email: z.string().email('Invalid email address'),
});
