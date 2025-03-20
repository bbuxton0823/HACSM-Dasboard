import { Router } from 'express';
import { 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  changePassword, 
  deleteUser 
} from '../controllers/user.controller';
import { verifyToken, isAdmin } from '../middleware/auth.middleware';
import { body, param } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Get all users (admin only)
router.get('/', isAdmin, getAllUsers);

// Get user by ID
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid user ID')],
  getUserById
);

// Create a new user (admin only)
router.post(
  '/',
  isAdmin,
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter')
      .matches(/\d/).withMessage('Password must contain at least one number'),
    body('role').optional()
  ],
  createUser
);

// Update user (admin only)
router.put(
  '/:id',
  isAdmin,
  [
    param('id').isUUID().withMessage('Invalid user ID'),
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('role').optional(),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
  updateUser
);

// Change user password
router.put(
  '/:id/change-password',
  [
    param('id').isUUID().withMessage('Invalid user ID'),
    body('currentPassword').optional(),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter')
      .matches(/\d/).withMessage('Password must contain at least one number')
  ],
  changePassword
);

// Delete user (admin only)
router.delete(
  '/:id',
  isAdmin,
  [param('id').isUUID().withMessage('Invalid user ID')],
  deleteUser
);

export default router;
