import { Router } from 'express';
import { register, login, getProfile } from '../controllers/auth.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { body } from 'express-validator';

const router = Router();

// Register route with validation
router.post(
  '/register',
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
  register
);

// Login route with validation
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  login
);

// Get user profile route (protected)
router.get('/profile', verifyToken, getProfile);

export default router;
