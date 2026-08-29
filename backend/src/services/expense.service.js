import { prisma } from '../config/database.js';
import { ApiError } from '../utils/api-error.js';

export class ExpenseService {
  static async getAllExpenses() {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' },
    });

    return expenses.map((e) => ({
      id: e.id,
      title: e.title,
      amount: Number(e.amount),
      date: e.date.toISOString().slice(0, 10),
      category: e.category,
      note: e.note || '',
    }));
  }

  static async saveExpense(data) {
    const amount = Number(data.amount) || 0;
    const category = data.category || 'Other';

    const expenseData = {
      title: data.title.trim(),
      amount,
      date: new Date(data.date),
      category,
      note: data.note ? data.note.trim() : '',
    };

    const isObjectId = data.id && /^[0-9a-fA-F]{24}$/.test(data.id);
    if (isObjectId) {
      const existing = await prisma.expense.findUnique({ where: { id: data.id } });
      if (existing) {
        const updated = await prisma.expense.update({
          where: { id: data.id },
          data: expenseData,
        });
        return { ...updated, amount: Number(updated.amount), date: updated.date.toISOString().slice(0, 10) };
      }
    }

    const created = await prisma.expense.create({
      data: expenseData,
    });

    return { ...created, amount: Number(created.amount), date: created.date.toISOString().slice(0, 10) };
  }

  static async deleteExpense(id) {
    const isObjectId = id && /^[0-9a-fA-F]{24}$/.test(id);
    if (!isObjectId) return true;

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) return true;

    await prisma.expense.delete({ where: { id } });
    return true;
  }
}
