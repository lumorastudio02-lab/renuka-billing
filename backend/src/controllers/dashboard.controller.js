import { DashboardService } from '../services/dashboard.service.js';
import { ApiResponse } from '../utils/api-response.js';

export class DashboardController {
  static async getOverview(req, res, next) {
    try {
      const overview = await DashboardService.getOverview();
      return ApiResponse.success(res, 'Dashboard overview data fetched successfully', overview);
    } catch (error) {
      next(error);
    }
  }
}
