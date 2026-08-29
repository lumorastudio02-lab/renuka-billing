import winston from 'winston';
import fs from 'fs';
import path from 'path';

const isVercel = Boolean(process.env.VERCEL);

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ level, message, timestamp, stack }) => {
        return `${timestamp} [${level}]: ${stack || message}`;
      })
    ),
  }),
];

if (!isVercel) {
  try {
    const localLogDir = 'logs';
    if (!fs.existsSync(localLogDir)) {
      fs.mkdirSync(localLogDir, { recursive: true });
    }
    transports.push(
      new winston.transports.File({ filename: path.join(localLogDir, 'error.log'), level: 'error' }),
      new winston.transports.File({ filename: path.join(localLogDir, 'combined.log') })
    );
  } catch (error) {
    // Gracefully fallback to console logging if file system is read-only
  }
}

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'renuka-paramedical-backend' },
  transports,
});
