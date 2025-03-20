import { Request, Response, NextFunction } from 'express';
import { User, UserRole } from '../models/User';

// Extend Request object with user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Simple auth middleware that doesn't require database connection
 * for authentication during development/testing
 */

/**
 * Role-based authorization middleware
 * This middleware checks if a user has one of the allowed roles
 * @param allowedRoles Array of role names allowed to access the route
 */
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user exists on request (should be set by auth middleware)
    if (!req.user) {
      res.status(401).json({ 
        status: 'error',
        message: 'Authentication required' 
      });
      return;
    }

    // Get user role from the user object
    const userRole = req.user.role.toString().toLowerCase();
    
    // Check if user's role is in the allowed roles array
    if (allowedRoles.some(role => role.toLowerCase() === userRole)) {
      next();
    } else {
      res.status(403).json({
        status: 'error',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
      return;
    }
  };
};
