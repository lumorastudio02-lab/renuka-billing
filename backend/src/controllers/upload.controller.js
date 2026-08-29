import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';

export class UploadController {
  static async uploadFile(req, res, next) {
    try {
      if (!req.file) {
        throw ApiError.badRequest('No file uploaded');
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      return ApiResponse.success(res, 'File uploaded successfully', {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
      });
    } catch (error) {
      next(error);
    }
  }
}
