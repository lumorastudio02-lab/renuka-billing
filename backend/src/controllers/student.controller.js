import { StudentService } from '../services/student.service.js';
import { ApiResponse } from '../utils/api-response.js';

export class StudentController {
  static async getAllStudents(req, res, next) {
    try {
      const { q, course, batch } = req.query;
      const students = await StudentService.getAllStudents({ query: q, course, batch });
      return ApiResponse.success(res, 'Students fetched successfully', students);
    } catch (error) {
      next(error);
    }
  }

  static async getNextId(req, res, next) {
    try {
      const nextId = await StudentService.getNextStudentId();
      return ApiResponse.success(res, 'Next student ID generated', { nextId });
    } catch (error) {
      next(error);
    }
  }

  static async saveStudent(req, res, next) {
    try {
      const result = await StudentService.saveStudent(req.body);
      return ApiResponse.success(res, 'Student record saved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteStudent(req, res, next) {
    try {
      const { id } = req.params;
      await StudentService.deleteStudent(id);
      return ApiResponse.success(res, 'Student deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async exportCSV(req, res, next) {
    try {
      const { q, course, batch } = req.query;
      const students = await StudentService.getAllStudents({ query: q, course, batch });

      const headers = [
        "Student ID", "Student Name", "Mobile Number", "Email", "Course", "Batch",
        "Admission Date", "Instalment Date", "Total Course Fee", "Total Paid Fee",
        "Remaining Fee", "Next Payment Due Date", "Payment Status"
      ];
      
      const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const rows = students.map((s) => [
        s.id, s.name, s.mobile, s.email, s.course, s.batch,
        s.admissionDate, s.instalmentDate, s.totalFee, s.paidFee,
        s.totalFee - s.paidFee, s.nextDueDate, s.status
      ].map(esc).join(","));

      const csv = [headers.map(esc).join(","), ...rows].join("\r\n");

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=students-export-${new Date().toISOString().slice(0, 10)}.csv`);
      return res.status(200).send("\uFEFF" + csv);
    } catch (error) {
      next(error);
    }
  }
}
