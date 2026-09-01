import { prisma } from '../config/database.js';
import { calculateDueStatus } from '../utils/formatters.js';

export class DashboardService {
  static async getOverview() {
    const studentWhere = { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] };

    const [studentAgg, expenseAgg, students] = await Promise.all([
      prisma.student.aggregate({
        where: studentWhere,
        _count: { id: true },
        _sum: { totalFee: true, paidFee: true },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
      }),
      prisma.student.findMany({
        where: studentWhere,
        select: {
          id: true,
          studentCode: true,
          name: true,
          mobile: true,
          email: true,
          course: true,
          batch: true,
          totalFee: true,
          paidFee: true,
          nextDueDate: true,
        },
      }),
    ]);

    const totalStudents = studentAgg._count?.id || 0;
    const totalFees = Number(studentAgg._sum?.totalFee) || 0;
    const totalPaid = Number(studentAgg._sum?.paidFee) || 0;
    const totalRemaining = Math.max(0, totalFees - totalPaid);
    const totalExpenses = Number(expenseAgg._sum?.amount) || 0;

    const formattedStudents = students.map((s) => ({
      id: s.studentCode || s.id,
      name: s.name,
      mobile: s.mobile,
      email: s.email || '',
      course: s.course,
      batch: s.batch,
      totalFee: Number(s.totalFee),
      paidFee: Number(s.paidFee),
      remainingFee: Math.max(0, Number(s.totalFee) - Number(s.paidFee)),
      nextDueDate: s.nextDueDate ? s.nextDueDate.toISOString().slice(0, 10) : '',
      dueStatus: calculateDueStatus(s),
    }));

    const dueToday = formattedStudents.filter((s) => s.dueStatus === 'Due Today');
    const dueTomorrow = formattedStudents.filter((s) => s.dueStatus === 'Due Tomorrow');
    const overdue = formattedStudents.filter((s) => s.dueStatus === 'Overdue');
    const upcoming = formattedStudents.filter((s) => s.dueStatus === 'Upcoming');

    return {
      metrics: {
        totalStudents,
        totalFees,
        totalPaid,
        totalRemaining,
        paymentsDueToday: dueToday.length,
        upcomingPayments: upcoming.length + dueTomorrow.length,
        totalExpenses,
      },
      reminders: {
        dueToday,
        dueTomorrow,
        overdue,
        upcoming,
      },
    };
  }
}
