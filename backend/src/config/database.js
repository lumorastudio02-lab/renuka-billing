import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
import { logger } from './logger.js';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export async function checkDatabaseConnection() {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    logger.info('Database connection established successfully.');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
}
