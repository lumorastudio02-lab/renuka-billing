import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export class EmailService {
  static getTransporter() {
    return nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_PORT === 465,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
      },
    });
  }

  static async sendReceiptEmail(studentEmail, studentName, receiptNo, amount, pdfBuffer) {
    if (!studentEmail) return false;

    try {
      const transporter = this.getTransporter();
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: studentEmail,
        subject: `Fee Payment Receipt - ${receiptNo} - Renuka Paramedical Institute`,
        html: `
          <h3>Dear ${studentName},</h3>
          <p>Thank you for your fee payment of <strong>₹${amount}</strong>.</p>
          <p>Your payment receipt <strong>${receiptNo}</strong> is attached to this email.</p>
          <br/>
          <p>Best regards,<br/>Renuka Paramedical Institute, Baramati</p>
        `,
        attachments: pdfBuffer
          ? [
              {
                filename: `Receipt_${receiptNo}.pdf`,
                content: pdfBuffer,
              },
            ]
          : [],
      });

      logger.info(`Receipt email sent successfully to ${studentEmail}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send receipt email to ${studentEmail}:`, error);
      return false;
    }
  }

  static async sendReminderEmail(studentEmail, studentName, remainingAmount, dueDate) {
    if (!studentEmail) return false;

    try {
      const transporter = this.getTransporter();
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: studentEmail,
        subject: `Upcoming Fee Installment Reminder - Renuka Paramedical Institute`,
        html: `
          <h3>Dear ${studentName},</h3>
          <p>This is a gentle reminder that your pending fee installment of <strong>₹${remainingAmount}</strong> is due on <strong>${dueDate}</strong>.</p>
          <p>Please make the payment at the institute office or via UPI to avoid late fees.</p>
          <br/>
          <p>Best regards,<br/>Renuka Paramedical Institute, Baramati</p>
        `,
      });

      logger.info(`Reminder email sent successfully to ${studentEmail}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send reminder email to ${studentEmail}:`, error);
      return false;
    }
  }
}
