import { ApiError } from '../utils/api-error.js';

export function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      const formattedErrors = error.errors
        ? error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        : [{ message: error.message }];

      return next(ApiError.badRequest('Validation failed', formattedErrors));
    }
  };
}
