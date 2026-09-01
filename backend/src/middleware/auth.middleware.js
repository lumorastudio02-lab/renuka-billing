import { verifyAccessToken } from '../utils/jwt.js';
import { ApiError } from '../utils/api-error.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    if (decoded) {
      req.user = decoded;
      return next();
    }
  }

  return next(ApiError.unauthorized('Authentication token missing or invalid format'));
}

