"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.changePassword = exports.updateUser = exports.createUser = exports.getUserById = exports.getAllUsers = void 0;
const database_1 = require("../config/database");
const User_1 = require("../models/User");
const bcrypt_1 = __importDefault(require("bcrypt"));
const class_validator_1 = require("class-validator");
// User repository
const userRepository = database_1.AppDataSource.getRepository(User_1.User);
// Get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await userRepository.find({
            select: ['id', 'firstName', 'lastName', 'email', 'role', 'isActive', 'lastLogin', 'createdAt', 'updatedAt']
        });
        res.status(200).json({
            status: 'success',
            data: users
        });
        return;
    }
    catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get users'
        });
        return;
    }
};
exports.getAllUsers = getAllUsers;
// Get user by ID
const getUserById = async (req, res) => {
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
    }
    catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get user'
        });
        return;
    }
};
exports.getUserById = getUserById;
// Create a new user (admin only)
const createUser = async (req, res) => {
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
        const user = new User_1.User();
        user.firstName = firstName;
        user.lastName = lastName;
        user.email = email;
        user.role = role || User_1.UserRole.USER;
        // Hash password
        const salt = await bcrypt_1.default.genSalt(10);
        user.password = await bcrypt_1.default.hash(password, salt);
        // Validate user data
        const errors = await (0, class_validator_1.validate)(user);
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
    }
    catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create user'
        });
        return;
    }
};
exports.createUser = createUser;
// Update user
const updateUser = async (req, res) => {
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
        if (firstName)
            user.firstName = firstName;
        if (lastName)
            user.lastName = lastName;
        if (role !== undefined)
            user.role = role;
        if (isActive !== undefined)
            user.isActive = isActive;
        // Validate updated user data
        const errors = await (0, class_validator_1.validate)(user);
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
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update user'
        });
        return;
    }
};
exports.updateUser = updateUser;
// Change user password
const changePassword = async (req, res) => {
    var _a, _b, _c, _d;
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
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== id && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== User_1.UserRole.ADMIN) {
            res.status(403).json({
                status: 'error',
                message: 'Not authorized to change this user\'s password'
            });
            return;
        }
        // If current user (not admin) is changing their own password, verify current password
        if (((_c = req.user) === null || _c === void 0 ? void 0 : _c.id) === id && ((_d = req.user) === null || _d === void 0 ? void 0 : _d.role) !== User_1.UserRole.ADMIN) {
            const isPasswordValid = await bcrypt_1.default.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                res.status(400).json({
                    status: 'error',
                    message: 'Current password is incorrect'
                });
                return;
            }
        }
        // Hash new password
        const salt = await bcrypt_1.default.genSalt(10);
        user.password = await bcrypt_1.default.hash(newPassword, salt);
        // Save updated user
        await userRepository.save(user);
        res.status(200).json({
            status: 'success',
            message: 'Password changed successfully'
        });
        return;
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to change password'
        });
        return;
    }
};
exports.changePassword = changePassword;
// Delete user
const deleteUser = async (req, res) => {
    var _a;
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
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) === id) {
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
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete user'
        });
        return;
    }
};
exports.deleteUser = deleteUser;
