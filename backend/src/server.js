import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { checkDatabaseConnection, prisma } from './config/database.js';

const PORT = env.PORT || 5000;

async function startServer() {
  await checkDatabaseConnection();

  const server = app.listen(PORT, () => {
    logger.info(`Enterprise REST Backend listening on port ${PORT} in ${env.NODE_ENV} mode`);
    logger.info(`Health check available at http://localhost:${PORT}/health`);
    logger.info(`API Base URL: http://localhost:${PORT}/api/v1`);
  });

  const gracefulShutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down HTTP server gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await prisma.$disconnect();
      logger.info('Database connections closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
// restart trigger
