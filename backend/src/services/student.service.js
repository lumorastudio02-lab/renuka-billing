import { prisma } from '../config/database.js';
import { ApiError } from '../utils/api-error.js';
import { formatStudentId, calculateDueStatus } from '../utils/formatters.js';

export class StudentService {
  static async getAllStudents({ query, course, batch }) {
    const where = {
      deletedAt: null,
      ...(course ? { course } : {}),
      ...(batch ? { batch } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { studentCode: { contains: query, mode: 'insensitive' } },
              { mobile: { contains: query, mode: 'insensitive' } },
              { course: { contains: query, mode: 'insensitive' } },
              { batch: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

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

    return students.map((s) => ({
      id: s.studentCode || s.id,
      internalId: s.id,
      name: s.name,
      mobile: s.mobile,
      email: s.email || '',
      course: s.course,
      batch: s.batch,
      admissionDate: s.admissionDate && !isNaN(new Date(s.admissionDate).getTime()) ? new Date(s.admissionDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      instalmentDate: s.instalmentDate && !isNaN(new Date(s.instalmentDate).getTime()) ? new Date(s.instalmentDate).toISOString().slice(0, 10) : '',
      totalFee: Number(s.totalFee) || 0,
      paidFee: Number(s.paidFee) || 0,
      nextDueDate: s.nextDueDate && !isNaN(new Date(s.nextDueDate).getTime()) ? new Date(s.nextDueDate).toISOString().slice(0, 10) : '',
      status: calculateDueStatus(s),
    }));
  }

  static async getNextStudentId() {
    const students = await prisma.student.findMany({
      select: { studentCode: true },
    });

    const max = students.reduce((m, s) => {
      const n = parseInt((s.studentCode || '').replace(/\D/g, ''), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);

    return formatStudentId(max + 1);
  }

  static async saveStudent(data) {
    const totalFee = Number(data.totalFee) || 0;
    const paidFee = Number(data.paidFee) || 0;

    let studentCode = data.id;
    if (!studentCode || !studentCode.startsWith('STU-')) {
      studentCode = await this.getNextStudentId();
    }

    const isObjectId = (val) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val);

    const orConditions = [{ studentCode }];
    if (data.id) orConditions.push({ studentCode: data.id });
    if (isObjectId(data.id)) orConditions.push({ id: data.id });

    const existing = await prisma.student.findFirst({
      where: { OR: orConditions },
    });

    const parseDate = (d) => {
      if (!d) return null;
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const studentData = {
      studentCode,
      name: data.name.trim(),
      mobile: data.mobile.trim(),
      email: data.email ? data.email.trim() : null,
      course: data.course.trim(),
      batch: data.batch.trim(),
      admissionDate: parseDate(data.admissionDate) || new Date(),
      instalmentDate: parseDate(data.instalmentDate),
      totalFee,
      paidFee,
      nextDueDate: parseDate(data.nextDueDate),
    };

    if (existing) {
      const updated = await prisma.student.update({
        where: { id: existing.id },
        data: studentData,
      });
      return { ...updated, id: updated.studentCode };
    }

    const created = await prisma.student.create({
      data: studentData,
    });
    return { ...created, id: created.studentCode };
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
