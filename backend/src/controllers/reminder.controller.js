import { DashboardService } from '../services/dashboard.service.js';
import { ApiResponse } from '../utils/api-response.js';

export class ReminderController {
  static async getReminders(req, res, next) {
    try {
      const overview = await DashboardService.getOverview();
      return ApiResponse.success(res, 'Fee reminders fetched successfully', overview.reminders);
    } catch (error) {
      next(error);
    }
  }
}
