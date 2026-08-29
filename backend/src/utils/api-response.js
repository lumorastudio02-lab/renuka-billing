export class ApiResponse {
  static success(res, message = 'Success', data = {}, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created(res, message = 'Resource created successfully', data = {}) {
    return this.success(res, message, data, 201);
  }

  static error(res, message = 'An error occurred', errors = [], statusCode = 400) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      statusCode,
    });
  }
}
