import morgan from 'morgan';
import { logger } from '../config/logger.js';

const stream = {
  write: (message) => logger.info(message.trim()),
};

export const requestLogger = morgan(
  ':remote-addr - :method :url HTTP/:http-version :status :res[content-length] - :response-time ms',
  { stream }
);
