import { ApiError } from '../utils/api-error.js';

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('User identity not verified'));
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }

    next();
  };
}
