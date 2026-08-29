import { prisma } from '../config/database.js';
import { ApiError } from '../utils/api-error.js';
import { formatReceiptNo } from '../utils/formatters.js';
import { NotificationService } from './notification.service.js';

export class PaymentService {
  static async getAllPayments(query = '') {
    const cleanQuery = query.trim().toLowerCase();

    let payments = [];
    try {
      payments = await prisma.payment.findMany({
        include: { student: true },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      });
    } catch (err) {
      payments = [];
    }

    const filtered = payments
      .filter((p) => {
        if (!p.student) return false;
        if (!cleanQuery) return true;
        const target = `${p.student.name} ${p.receiptNo}`.toLowerCase();
        return target.includes(cleanQuery);
      })
      .map((p) => ({
        id: p.id,
        receiptNo: p.receiptNo,
        studentId: p.student.studentCode || p.student.id,
        studentName: p.student.name,
        amount: Number(p.amount),
        date: p.date.toISOString().slice(0, 10),
        mode: p.mode === 'Bank_Transfer' ? 'Bank Transfer' : p.mode,
        upiReference: p.upiReference || undefined,
        nextDueDate: p.nextDueDate ? p.nextDueDate.toISOString().slice(0, 10) : '',
        previouslyPaid: Number(p.previouslyPaid),
        remainingAfter: Number(p.remainingAfter),
      }));

    return filtered;
  }

  static async getNextReceiptNo() {
    const payments = await prisma.payment.findMany({
      select: { receiptNo: true },
    });

    const max = payments.reduce((m, p) => {
      const n = parseInt((p.receiptNo || '').replace(/\D/g, ''), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 1000);

    return formatReceiptNo(max + 1);
  }

  static async addPayment(data) {
    const isObjectId = typeof data.studentId === 'string' && /^[0-9a-fA-F]{24}$/.test(data.studentId);
    const orConditions = [{ studentCode: data.studentId }];
    if (isObjectId) orConditions.push({ id: data.studentId });

    const student = await prisma.student.findFirst({
      where: { OR: orConditions },
      include: { payments: true },
    });

    if (!student) {
      throw ApiError.notFound('Student not found');
    }

    const amount = Number(data.amount) || 0;
    const currentPaid = Number(student.paidFee) || 0;
    const totalFee = Number(student.totalFee) || 0;
    const remainingBefore = Math.max(0, totalFee - currentPaid);

    if (amount > remainingBefore) {
      throw ApiError.badRequest(`Payment amount (₹${amount}) exceeds remaining fee (₹${remainingBefore})`);
    }

    const newPaid = currentPaid + amount;
    const remainingAfter = Math.max(0, totalFee - newPaid);
    const receiptNo = await this.getNextReceiptNo();

    const dbMode = data.mode === 'Bank Transfer' ? 'Bank_Transfer' : data.mode;

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          receiptNo,
          studentId: student.id,
          amount,
          date: new Date(data.date),
          mode: dbMode,
          upiReference: data.mode === 'UPI' ? (data.upiReference ? data.upiReference.trim() : null) : null,
          nextDueDate: remainingAfter <= 0 ? null : (data.nextDueDate ? new Date(data.nextDueDate) : null),
          previouslyPaid: currentPaid,
          remainingAfter,
        },
      }),
      prisma.student.update({
        where: { id: student.id },
        data: {
          paidFee: newPaid,
          nextDueDate: remainingAfter <= 0 ? null : (data.nextDueDate ? new Date(data.nextDueDate) : null),
        },
      }),
    ]);

    await NotificationService.createNotification({
      title: 'Fee Payment Received',
      message: `Received payment of ₹${amount} for ${student.name} (${payment.receiptNo})`,
      type: 'PAYMENT_RECEIVED',
    });

    return {
      id: payment.id,
      receiptNo: payment.receiptNo,
      studentId: student.studentCode,
      studentName: student.name,
      amount: Number(payment.amount),
      date: payment.date.toISOString().slice(0, 10),
      mode: data.mode,
      upiReference: payment.upiReference || undefined,
      nextDueDate: payment.nextDueDate ? payment.nextDueDate.toISOString().slice(0, 10) : '',
      previouslyPaid: Number(payment.previouslyPaid),
      remainingAfter: Number(payment.remainingAfter),
    };
  }

  static async updatePayment(id, data) {
    const existing = await prisma.payment.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!existing) {
      throw ApiError.notFound('Payment record not found');
    }

    const amount = Number(data.amount) || 0;
    const dbMode = data.mode === 'Bank Transfer' ? 'Bank_Transfer' : data.mode;

    await prisma.payment.update({
      where: { id },
      data: {
        amount,
        date: new Date(data.date),
        mode: dbMode,
        upiReference: data.mode === 'UPI' ? (data.upiReference ? data.upiReference.trim() : null) : null,
        nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
      },
    });

    await this.recalculateStudentPayments(existing.studentId);

    const updated = await prisma.payment.findUnique({
      where: { id },
      include: { student: true },
    });

    return {
      id: updated.id,
      receiptNo: updated.receiptNo,
      studentId: updated.student.studentCode,
      studentName: updated.student.name,
      amount: Number(updated.amount),
      date: updated.date.toISOString().slice(0, 10),
      mode: data.mode,
      upiReference: updated.upiReference || undefined,
      nextDueDate: updated.nextDueDate ? updated.nextDueDate.toISOString().slice(0, 10) : '',
      previouslyPaid: Number(updated.previouslyPaid),
      remainingAfter: Number(updated.remainingAfter),
    };
  }

  static async deletePayment(id) {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return true;

    await prisma.payment.delete({ where: { id } });
    await this.recalculateStudentPayments(payment.studentId);
    return true;
  }

  static async recalculateStudentPayments(studentId) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { payments: { orderBy: { date: 'asc' } } },
    });

    if (!student) return;

    let cumulativePaid = 0;
    for (const p of student.payments) {
      const pAmount = Number(p.amount) || 0;
      const prev = cumulativePaid;
      cumulativePaid += pAmount;
      const remAfter = Math.max(0, Number(student.totalFee) - cumulativePaid);

      await prisma.payment.update({
        where: { id: p.id },
        data: {
          previouslyPaid: prev,
          remainingAfter: remAfter,
        },
      });
    }

    const totalPaid = cumulativePaid;
    const latestPayment = student.payments[student.payments.length - 1];
    const isFullyPaid = totalPaid >= Number(student.totalFee);

    await prisma.student.update({
      where: { id: studentId },
      data: {
        paidFee: totalPaid,
        nextDueDate: isFullyPaid ? null : (latestPayment?.nextDueDate || student.nextDueDate),
      },
    });
  }
}
