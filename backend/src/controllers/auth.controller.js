import { AuthService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/api-response.js';

export class AuthController {
  static async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const result = await AuthService.login(username, password);
      return ApiResponse.success(res, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  }

  static async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      return ApiResponse.created(res, 'User registered successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);
      return ApiResponse.success(res, 'Token refreshed successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await AuthService.logout(refreshToken);
      return ApiResponse.success(res, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }
}
