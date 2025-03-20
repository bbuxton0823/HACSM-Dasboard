import { Router } from 'express';
import { uploadFile, downloadTemplate } from '../controllers/import.controller';
import { verifyToken, isUser } from '../middleware/auth.middleware';
import { upload } from '../utils/fileUpload';
import { param } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Upload file route (admin/user only)
router.post(
  '/upload',
  isUser,
  upload.single('file'),
  uploadFile
);

// Download template route
router.get(
  '/template/:templateType',
  [
    param('templateType')
      .isIn(['budget', 'reserves', 'expenditures', 'commitments'])
      .withMessage('Invalid template type')
  ],
  downloadTemplate
);

export default router;
