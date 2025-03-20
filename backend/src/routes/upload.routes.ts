import express from 'express';
import { 
  handleFileUpload, 
  upload, 
  getStyleTemplates,
  deleteStyleTemplate 
} from '../controllers/upload.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Upload file
router.post('/', upload.single('file'), handleFileUpload);

// Get all style templates
router.get('/style-templates', getStyleTemplates);

// Delete a style template
router.delete('/style-templates/:id', deleteStyleTemplate);

export default router;
