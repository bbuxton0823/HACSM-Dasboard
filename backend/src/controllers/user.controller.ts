import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import bcrypt from 'bcrypt';
import { validate } from 'class-validator';

// User repository
const userRepository = AppDataSource.getRepository(User);

// Get all users
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await userRepository.find({
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'isActive', 'lastLogin', 'createdAt', 'updatedAt']
    });
    
    res.status(200).json({
      status: 'success',
      data: users
    });
    return;
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get users'
    });
    return;
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const user = await userRepository.findOne({
      where: { id },
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'isActive', 'lastLogin', 'createdAt', 'updatedAt']
    });
    
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
      return;
    }
    
    res.status(200).json({
      status: 'success',
      data: user
    });
    return;
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user'
    });
    return;
  }
};

// Create a new user (admin only)
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
      return;
    }
    
    // Create new user
    const user = new User();
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.role = role || UserRole.USER;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    // Validate user data
    const errors = await validate(user);
    if (errors.length > 0) {
      res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: errors.map(error => ({
          property: error.property,
          constraints: error.constraints
        }))
      });
      return;
    }
    
    // Save user to database
    await userRepository.save(user);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: userWithoutPassword
    });
    return;
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create user'
    });
    return;
  }
};

// Update user
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role, isActive } = req.body;
    
    // Find user
    const user = await userRepository.findOne({ where: { id } });
    
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
      return;
    }
    
    // Check if email is being changed and if it's already in use
    if (email && email !== user.email) {
      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser) {
        res.status(400).json({
          status: 'error',
          message: 'Email is already in use'
        });
        return;
      }
      user.email = email;
    }
    
    // Update user fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    
    // Validate updated user data
    const errors = await validate(user);
    if (errors.length > 0) {
      res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: errors.map(error => ({
          property: error.property,
          constraints: error.constraints
        }))
      });
      return;
    }
    
    // Save updated user
    await userRepository.save(user);
    
    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: user
    });
    return;
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user'
    });
    return;
  }
};

// Change user password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    // Find user with password
    const user = await userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id })
      .getOne();
    
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
      return;
    }
    
    // Check if it's the current user or an admin
    if (req.user?.id !== id && req.user?.role !== UserRole.ADMIN) {
      res.status(403).json({
        status: 'error',
        message: 'Not authorized to change this user\'s password'
      });
      return;
    }
    
    // If current user (not admin) is changing their own password, verify current password
    if (req.user?.id === id && req.user?.role !== UserRole.ADMIN) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        res.status(400).json({
          status: 'error',
          message: 'Current password is incorrect'
        });
        return;
      }
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Save updated user
    await userRepository.save(user);
    
    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
    return;
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to change password'
    });
    return;
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Find user
    const user = await userRepository.findOne({ where: { id } });
    
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
      return;
    }
    
    // Prevent deleting your own account
    if (req.user?.id === id) {
      res.status(400).json({
        status: 'error',
        message: 'You cannot delete your own account'
      });
      return;
    }
    
    // Delete user
    await userRepository.remove(user);
    
    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
    return;
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete user'
    });
    return;
  }
};
