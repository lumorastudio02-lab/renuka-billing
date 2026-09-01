import { ExpenseService } from '../services/expense.service.js';
import { ApiResponse } from '../utils/api-response.js';

export class ExpenseController {
  static async getAllExpenses(req, res, next) {
    try {
      const { q, category, page, limit } = req.query;
      const result = await ExpenseService.getAllExpenses({ query: q, category, page, limit });
      return ApiResponse.success(res, 'Expenses fetched successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async saveExpense(req, res, next) {
    try {
      const expense = await ExpenseService.saveExpense(req.body);
      return ApiResponse.success(res, 'Expense saved successfully', expense);
    } catch (error) {
      next(error);
    }
  }

  static async deleteExpense(req, res, next) {
    try {
      const { id } = req.params;
      await ExpenseService.deleteExpense(id);
      return ApiResponse.success(res, 'Expense deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
