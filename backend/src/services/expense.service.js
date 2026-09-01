import { prisma } from '../config/database.js';
import { ApiError } from '../utils/api-error.js';

export class ExpenseService {
  static async getAllExpenses({ query = '', category = '', page, limit } = {}) {
    const cleanQuery = typeof query === 'string' ? query.trim() : '';
    const where = {
      ...(category ? { category } : {}),
    };

    if (cleanQuery) {
      where.OR = [
        { title: { contains: cleanQuery, mode: 'insensitive' } },
        { note: { contains: cleanQuery, mode: 'insensitive' } },
      ];
    }

    const pageNum = page ? Math.max(1, parseInt(page, 10) || 1) : null;
    const limitNum = limit ? Math.max(1, parseInt(limit, 10) || 50) : null;
    const isPaginated = pageNum !== null || limitNum !== null;

    let expenses = [];
    let totalCount = 0;

    if (isPaginated) {
      const p = pageNum || 1;
      const l = limitNum || 50;
      const skip = (p - 1) * l;

      [totalCount, expenses] = await Promise.all([
        prisma.expense.count({ where }),
        prisma.expense.findMany({
          where,
          orderBy: { date: 'desc' },
          skip,
          take: l,
        }),
      ]);
    } else {
      expenses = await prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
      });
      totalCount = expenses.length;
    }

    const formatted = expenses.map((e) => ({
      id: e.id,
      title: e.title,
      amount: Number(e.amount),
      date: e.date.toISOString().slice(0, 10),
      category: e.category,
      note: e.note || '',
    }));

    if (isPaginated) {
      const p = pageNum || 1;
      const l = limitNum || 50;
      return {
        data: formatted,
        pagination: {
          total: totalCount,
          page: p,
          limit: l,
          totalPages: Math.ceil(totalCount / l),
        },
      };
    }

    return formatted;
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
