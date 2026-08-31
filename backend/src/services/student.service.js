import { prisma } from '../config/database.js';
import { ApiError } from '../utils/api-error.js';
import { formatStudentId, calculateDueStatus } from '../utils/formatters.js';
import { PaymentService } from './payment.service.js';

export class StudentService {
  static async syncMissingInitialPayments() {
    try {
      await this.migrateLegacyStudentCodes();

      const students = await prisma.student.findMany({
        where: { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] },
        include: { payments: true },
      });

      for (const s of students) {
        await this.syncMissingInitialPaymentsForStudent(s);
      }
    } catch (err) {
      console.error('Error syncing missing initial payments:', err);
    }
  }

  static async migrateLegacyStudentCodes() {
    try {
      const legacyStudents = await prisma.student.findMany({
        where: {
          OR: [
            { studentCode: { startsWith: 'STU-' } },
            { studentCode: '' },
          ],
        },
      });

      for (const s of legacyStudents) {
        const newCode = await this.getNextStudentId(s.course);
        await prisma.student.update({
          where: { id: s.id },
          data: { studentCode: newCode },
        });
      }
    } catch (err) {
      console.error('Error migrating legacy student codes:', err);
    }
  }

  static async syncMissingInitialPaymentsForStudent(studentOrId) {
    try {
      const student = typeof studentOrId === 'string'
        ? await prisma.student.findUnique({ where: { id: studentOrId }, include: { payments: true } })
        : studentOrId;

      if (!student) return;

      const paidFee = Number(student.paidFee) || 0;
      const existingPaymentsTotal = (student.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      if (paidFee > existingPaymentsTotal) {
        const diff = paidFee - existingPaymentsTotal;
        const nextReceiptNo = await PaymentService.getNextReceiptNo();

        let paymentDate = student.admissionDate && !isNaN(new Date(student.admissionDate).getTime())
          ? new Date(student.admissionDate)
          : new Date();

        let nextDueDate = student.nextDueDate && !isNaN(new Date(student.nextDueDate).getTime())
          ? new Date(student.nextDueDate)
          : null;

        if (nextDueDate && nextDueDate.getFullYear() < 100) {
          nextDueDate.setFullYear(2000 + nextDueDate.getFullYear());
        }

        await prisma.payment.create({
          data: {
            receiptNo: nextReceiptNo,
            studentId: student.id,
            amount: diff,
            date: paymentDate,
            mode: 'Cash',
            previouslyPaid: existingPaymentsTotal,
            remainingAfter: Math.max(0, Number(student.totalFee) - paidFee),
            nextDueDate,
          },
        });
      }
    } catch (err) {
      console.error('Error syncing initial payment for student:', err);
    }
  }

  static async getAllStudents({ query, course, batch }) {
    await this.syncMissingInitialPayments();

    const where = {
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      ...(course ? { course } : {}),
      ...(batch ? { batch } : {}),
    };

    if (query) {
      where.AND = [
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { studentCode: { contains: query, mode: 'insensitive' } },
            { mobile: { contains: query, mode: 'insensitive' } },
            { course: { contains: query, mode: 'insensitive' } },
            { year: { contains: query, mode: 'insensitive' } },
            { batch: { contains: query, mode: 'insensitive' } },
          ],
        },
      ];
    }

    let students = [];
    try {
      students = await prisma.student.findMany({
        where,
        orderBy: [{ course: 'asc' }, { batch: 'asc' }, { name: 'asc' }],
        include: { payments: true },
      });
    } catch (err) {
      console.error('Error fetching students from MongoDB:', err);
      students = [];
    }

    const formatDateStr = (d) => {
      if (!d) return '';
      let dateObj = new Date(d);
      if (isNaN(dateObj.getTime())) return '';
      if (dateObj.getFullYear() < 100) {
        dateObj.setFullYear(2000 + dateObj.getFullYear());
      }
      return dateObj.toISOString().slice(0, 10);
    };

    return students.map((s) => ({
      id: s.studentCode || s.id,
      internalId: s.id,
      name: s.name,
      mobile: s.mobile,
      email: s.email || '',
      course: s.course,
      year: s.year || '',
      batch: s.batch,
      admissionDate: formatDateStr(s.admissionDate) || new Date().toISOString().slice(0, 10),
      instalmentDate: formatDateStr(s.instalmentDate),
      totalFee: Number(s.totalFee) || 0,
      paidFee: Number(s.paidFee) || 0,
      nextDueDate: formatDateStr(s.nextDueDate),
      status: calculateDueStatus(s),
    }));
  }

  static async getNextStudentId(course) {
    const prefix = (course && course.trim() ? course.trim().charAt(0) : 'S').toUpperCase();
    const students = await prisma.student.findMany({
      select: { studentCode: true },
    });

    const max = students.reduce((m, s) => {
      if (!s.studentCode) return m;
      const code = s.studentCode.trim().toUpperCase();
      if (code.startsWith(prefix)) {
        const numPart = code.slice(prefix.length).replace(/\D/g, '');
        const n = parseInt(numPart, 10);
        return isNaN(n) ? m : Math.max(m, n);
      }
      return m;
    }, 0);

    return formatStudentId(max + 1, course);
  }

  static async saveStudent(data) {
    const totalFee = Number(data.totalFee) || 0;
    const paidFee = Number(data.paidFee) || 0;

    const isObjectId = (val) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val);

    const searchConditions = [];
    if (data.id) searchConditions.push({ studentCode: data.id });
    if (isObjectId(data.id)) searchConditions.push({ id: data.id });

    let existing = null;
    if (searchConditions.length > 0) {
      existing = await prisma.student.findFirst({
        where: { OR: searchConditions },
      });
    }

    let studentCode = data.id;
    const expectedPrefix = (data.course && data.course.trim() ? data.course.trim().charAt(0) : 'S').toUpperCase();

    if (existing && existing.studentCode && !existing.studentCode.startsWith('STU-')) {
      studentCode = existing.studentCode;
    } else if (!studentCode || studentCode.startsWith('STU-') || !studentCode.toUpperCase().startsWith(expectedPrefix)) {
      studentCode = await this.getNextStudentId(data.course);
    }

    const parseDate = (d) => {
      if (!d) return null;
      let dateStr = String(d);
      if (dateStr.startsWith('00')) {
        dateStr = '20' + dateStr.slice(2);
      }
      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) return null;
      if (parsed.getFullYear() < 100) {
        parsed.setFullYear(2000 + parsed.getFullYear());
      }
      return parsed;
    };

    const studentData = {
      studentCode,
      name: data.name.trim(),
      mobile: data.mobile.trim(),
      email: data.email ? data.email.trim() : null,
      course: data.course.trim(),
      year: data.year ? data.year.trim() : null,
      batch: data.batch.trim(),
      admissionDate: parseDate(data.admissionDate) || new Date(),
      instalmentDate: parseDate(data.instalmentDate),
      totalFee,
      paidFee,
      nextDueDate: parseDate(data.nextDueDate),
    };

    let targetStudent;
    if (existing) {
      targetStudent = await prisma.student.update({
        where: { id: existing.id },
        data: studentData,
      });
    } else {
      targetStudent = await prisma.student.create({
        data: studentData,
      });
    }

    await this.syncMissingInitialPaymentsForStudent(targetStudent.id);

    return { ...targetStudent, id: targetStudent.studentCode };
  }

  static async deleteStudent(studentIdOrCode) {
    const isObjectId = typeof studentIdOrCode === 'string' && /^[0-9a-fA-F]{24}$/.test(studentIdOrCode);
    const orConditions = [{ studentCode: studentIdOrCode }];
    if (isObjectId) orConditions.push({ id: studentIdOrCode });

    const student = await prisma.student.findFirst({
      where: { OR: orConditions },
    });

    if (!student) {
      throw ApiError.notFound('Student not found');
    }

    await prisma.payment.deleteMany({ where: { studentId: student.id } });
    await prisma.student.delete({ where: { id: student.id } });

    return true;
  }
}

