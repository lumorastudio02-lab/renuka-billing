import { PaymentService } from '../services/payment.service.js';
import { ApiResponse } from '../utils/api-response.js';

export class PaymentController {
  static async getAllPayments(req, res, next) {
    try {
      const { q } = req.query;
      const payments = await PaymentService.getAllPayments(q);
      return ApiResponse.success(res, 'Payments fetched successfully', payments);
    } catch (error) {
      next(error);
    }
  }

  static async getNextReceiptNo(req, res, next) {
    try {
      const nextReceiptNo = await PaymentService.getNextReceiptNo();
      return ApiResponse.success(res, 'Next receipt number generated', { nextReceiptNo });
    } catch (error) {
      next(error);
    }
  }

  static async addPayment(req, res, next) {
    try {
      const payment = await PaymentService.addPayment(req.body);
      return ApiResponse.created(res, 'Fee payment recorded successfully', payment);
    } catch (error) {
      next(error);
    }
  }

  static async updatePayment(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await PaymentService.updatePayment(id, req.body);
      return ApiResponse.success(res, 'Payment updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }

  static async deletePayment(req, res, next) {
    try {
      const { id } = req.params;
      await PaymentService.deletePayment(id);
      return ApiResponse.success(res, 'Payment deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
