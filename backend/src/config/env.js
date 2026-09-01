import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((v) => parseInt(v, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('mongodb://localhost:27017/renuka_billing_db'),
  DEFAULT_ADMIN_USERNAME: z.string().default('admin'),
  DEFAULT_ADMIN_PASSWORD: z.string().default('Renuka@2143'),
  JWT_SECRET: z.string().default('super_secret_enterprise_jwt_key_renuka_paramedical_2026'),
  JWT_REFRESH_SECRET: z.string().default('super_secret_enterprise_jwt_refresh_key_2026'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  UPLOAD_PATH: z.string().default('uploads/'),
  MAX_FILE_SIZE_MB: z.string().default('5').transform((v) => parseInt(v, 10)),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid Environment Variables Configuration:', parsed.error.format());
}

export const env = parsed.data || {
  PORT: 5000,
  NODE_ENV: 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'mongodb://localhost:27017/renuka_billing_db',
  DEFAULT_ADMIN_USERNAME: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
  DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD || 'Renuka@2143',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_enterprise_jwt_key_renuka_paramedical_2026',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'super_secret_enterprise_jwt_refresh_key_2026',
  JWT_EXPIRES_IN: '1d',
  JWT_REFRESH_EXPIRES_IN: '7d',
  CORS_ORIGIN: '*',
  UPLOAD_PATH: 'uploads/',
  MAX_FILE_SIZE_MB: 5,
};
