import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { env } from './config/env.js';
import { requestLogger } from './middleware/request-logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { apiLimiter } from './middleware/rate-limiter.js';
import routes from './routes/index.js';
import { ApiResponse } from './utils/api-response.js';
import { logger } from './config/logger.js';

const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

const allowedOrigins = env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',');
logger.info(`Allowed Origins: ${JSON.stringify(allowedOrigins)}`);
app.use(cors({
  origin: allowedOrigins,
}));

// Performance & Parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logging
app.use(requestLogger);

// Rate Limiting
app.use('/api', apiLimiter);

// Serve static uploads
app.use('/uploads', express.static(path.resolve(env.UPLOAD_PATH)));

// Root Endpoint
app.get('/', (req, res) => {
  return ApiResponse.success(res, 'Renuka Billing & Paramedical API is operational', {
    health: '/health',
    apiBase: '/api/v1',
  });
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  return ApiResponse.success(res, 'Backend service is healthy and operational', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Serve API Documentation
app.use('/docs', express.static(path.resolve('docs')));
app.get('/api/v1/docs/swagger.json', (req, res) => {
  res.sendFile(path.resolve('docs/swagger.json'));
});

// API Routes Base Path
app.use('/api/v1', routes);

// Fallback 404 Route
app.use((req, res, next) => {
  return ApiResponse.error(res, `Route not found: ${req.originalUrl}`, [], 404);
});

// Global Error Handler
app.use(errorHandler);

export default app;
