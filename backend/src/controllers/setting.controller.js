import { SettingService } from '../services/setting.service.js';
import { ApiResponse } from '../utils/api-response.js';

export class SettingController {
  static async getSettings(req, res, next) {
    try {
      const settings = await SettingService.getSettings();
      return ApiResponse.success(res, 'Institute settings retrieved successfully', settings);
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req, res, next) {
    try {
      const settings = await SettingService.updateSettings(req.body);
      return ApiResponse.success(res, 'Institute settings updated successfully', settings);
    } catch (error) {
      next(error);
    }
  }
}
