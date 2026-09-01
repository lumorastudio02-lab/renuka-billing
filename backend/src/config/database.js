import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
import { logger } from './logger.js';

export const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

export async function checkDatabaseConnection() {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    logger.info('Database connection established successfully.');
    return true;
  } catch (error) {
    logger.warn('Database connection unavailable (MongoDB Atlas offline or IP blocked). Server running with fallbacks.');
    return false;
  }
}
