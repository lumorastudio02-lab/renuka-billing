import { prisma } from '../config/database.js';
import { calculateDueStatus } from '../utils/formatters.js';

export class DashboardService {
  static async getOverview() {
    const students = await prisma.student.findMany({ where: { deletedAt: null } });
    const expenses = await prisma.expense.findMany();

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

    const totalStudents = formattedStudents.length;
    const totalFees = formattedStudents.reduce((a, s) => a + s.totalFee, 0);
    const totalPaid = formattedStudents.reduce((a, s) => a + s.paidFee, 0);
    const totalRemaining = formattedStudents.reduce((a, s) => a + s.remainingFee, 0);
    const totalExpenses = expenses.reduce((a, e) => a + Number(e.amount), 0);

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
