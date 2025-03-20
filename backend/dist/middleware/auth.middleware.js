"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUser = exports.isAdmin = exports.verifyToken = exports.devModeBypass = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const User_1 = require("../models/User");
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
// Development mode bypass middleware
const devModeBypass = (req, res, next) => {
    // Check if we're in development mode
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
        // Create a mock admin user
        req.user = {
            id: '1',
            username: 'dev-admin',
            email: 'dev@example.com',
            role: User_1.UserRole.ADMIN,
            firstName: 'Development',
            lastName: 'Admin',
            createdAt: new Date(),
            updatedAt: new Date(),
            password: '',
            lastLogin: new Date(),
            isActive: true,
            resetToken: null,
            resetTokenExpiry: null
        };
        console.log('Development mode: Authentication bypassed');
        next();
        return;
    }
    // If not in dev mode or bypass not enabled, proceed to next middleware
    next();
};
exports.devModeBypass = devModeBypass;
// Verify JWT token middleware
const verifyToken = async (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default_secret');
        const userRepository = database_1.AppDataSource.getRepository(User_1.User);
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
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
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
exports.verifyToken = verifyToken;
// Check if user has admin role
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === User_1.UserRole.ADMIN) {
        next();
    }
    else {
        res.status(403).json({
            status: 'error',
            message: 'Access denied. Admin privileges required.'
        });
        return;
    }
};
exports.isAdmin = isAdmin;
// Check if user has at least user role (not readonly)
const isUser = (req, res, next) => {
    if (req.user && (req.user.role === User_1.UserRole.USER || req.user.role === User_1.UserRole.ADMIN)) {
        next();
    }
    else {
        res.status(403).json({
            status: 'error',
            message: 'Access denied. User privileges required.'
        });
        return;
    }
};
exports.isUser = isUser;
