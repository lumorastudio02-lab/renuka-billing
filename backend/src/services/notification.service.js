import { prisma } from '../config/database.js';
import { ApiError } from '../utils/api-error.js';
import { logger } from '../config/logger.js';
import { EmailService } from './email.service.js';

export class NotificationService {
  static async createNotification({ title, message, type = 'INFO' }) {
    try {
      const notification = await prisma.notification.create({
        data: { title, message, type },
      });
      return notification;
    } catch (error) {
      logger.error('Failed to create notification:', error);
      return null;
    }
  }

  static async getNotifications({ page = 1, limit = 20, isRead }) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (typeof isRead === 'boolean') {
      where.isRead = isRead;
    } else if (isRead === 'true') {
      where.isRead = true;
    } else if (isRead === 'false') {
      where.isRead = false;
    }

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.notification.count({ where }),
    ]);

    const unreadCount = await prisma.notification.count({ where: { isRead: false } });

    return {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      unreadCount,
    };
  }

  static async markAsRead(id) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw ApiError.notFound('Notification not found');
    }

    return await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  static async markAllAsRead() {
    await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
    return true;
  }

  static async deleteNotification(id) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw ApiError.notFound('Notification not found');
    }

    await prisma.notification.delete({ where: { id } });
    return true;
  }

  static async sendFeeReminderEmail(studentId) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student || !student.email) {
      throw ApiError.badRequest('Student not found or has no valid email address');
    }

    const remaining = Number(student.totalFee) - Number(student.paidFee);
    const dueDateStr = student.nextDueDate ? student.nextDueDate.toISOString().slice(0, 10) : 'N/A';

    const sent = await EmailService.sendReminderEmail(
      student.email,
      student.name,
      remaining,
      dueDateStr
    );

    if (sent) {
      await this.createNotification({
        title: 'Reminder Email Sent',
        message: `Fee payment reminder email sent to ${student.name} (${student.email})`,
        type: 'EMAIL_REMINDER',
      });
    }

    return sent;
  }
}
