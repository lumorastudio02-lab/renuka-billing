import { NotificationService } from '../services/notification.service.js';
import { ApiResponse } from '../utils/api-response.js';

export class NotificationController {
  static async getNotifications(req, res, next) {
    try {
      const { page, limit, isRead } = req.query;
      const data = await NotificationService.getNotifications({ page, limit, isRead });
      return ApiResponse.success(res, 'Notifications retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await NotificationService.markAsRead(id);
      return ApiResponse.success(res, 'Notification marked as read', updated);
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req, res, next) {
    try {
      await NotificationService.markAllAsRead();
      return ApiResponse.success(res, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }

  static async deleteNotification(req, res, next) {
    try {
      const { id } = req.params;
      await NotificationService.deleteNotification(id);
      return ApiResponse.success(res, 'Notification deleted');
    } catch (error) {
      next(error);
    }
  }

  static async sendReminderEmail(req, res, next) {
    try {
      const { studentId } = req.body;
      const sent = await NotificationService.sendFeeReminderEmail(studentId);
      return ApiResponse.success(res, 'Reminder email triggered', { sent });
    } catch (error) {
      next(error);
    }
  }
}
