import { ApiResponse } from '../utils/api-response.js';

export class UserController {
  static async getProfile(req, res, next) {
    try {
      return ApiResponse.success(res, 'User profile retrieved successfully', { user: req.user });
    } catch (error) {
      next(error);
    }
  }
}
