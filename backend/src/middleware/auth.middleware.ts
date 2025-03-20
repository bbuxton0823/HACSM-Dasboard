import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import { config } from 'dotenv';

// Load environment variables
config();

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Development mode bypass middleware
export const devModeBypass = (req: Request, res: Response, next: NextFunction): void => {
  // Check if we're in development mode
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    // Create a mock admin user
    req.user = {
      id: '1',
      username: 'dev-admin',
      email: 'dev@example.com',
      role: UserRole.ADMIN,
      firstName: 'Development',
      lastName: 'Admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      password: '',
      lastLogin: new Date(),
      isActive: true,
      resetToken: null,
      resetTokenExpiry: null
    } as User;
    
    console.log('Development mode: Authentication bypassed');
    next();
    return;
  }
  
  // If not in dev mode or bypass not enabled, proceed to next middleware
  next();
};

// Verify JWT token middleware
export const verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Skip verification if user is already set (by devModeBypass)
  if (req.user) {
    next();
    return;
  }
  
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        status: 'error', 
        message: 'Authentication required. Please log in.' 
      });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ 
        status: 'error', 
        message: 'Authentication token is missing' 
      });
      return;
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as any;
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.id } });
    
    if (!user) {
      res.status(401).json({ 
        status: 'error', 
        message: 'User not found or inactive' 
      });
      return;
    }
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ 
        status: 'error', 
        message: 'Invalid or expired token' 
      });
      return;
    }
    
    res.status(500).json({ 
      status: 'error', 
      message: 'Internal server error during authentication' 
    });
    return;
  }
};

// Check if user has admin role
export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === UserRole.ADMIN) {
    next();
  } else {
    res.status(403).json({ 
      status: 'error', 
      message: 'Access denied. Admin privileges required.' 
    });
    return;
  }
};

// Check if user has at least user role (not readonly)
export const isUser = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user && (req.user.role === UserRole.USER || req.user.role === UserRole.ADMIN)) {
    next();
  } else {
    res.status(403).json({ 
      status: 'error', 
      message: 'Access denied. User privileges required.' 
    });
    return;
  }
};
