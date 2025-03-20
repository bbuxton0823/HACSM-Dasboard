"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.verifyToken);
// Get all users (admin only)
router.get('/', auth_middleware_1.isAdmin, user_controller_1.getAllUsers);
// Get user by ID
router.get('/:id', [(0, express_validator_1.param)('id').isUUID().withMessage('Invalid user ID')], user_controller_1.getUserById);
// Create a new user (admin only)
router.post('/', auth_middleware_1.isAdmin, [
    (0, express_validator_1.body)('firstName').notEmpty().withMessage('First name is required'),
    (0, express_validator_1.body)('lastName').notEmpty().withMessage('Last name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter')
        .matches(/\d/).withMessage('Password must contain at least one number'),
    (0, express_validator_1.body)('role').optional()
], user_controller_1.createUser);
// Update user (admin only)
router.put('/:id', auth_middleware_1.isAdmin, [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid user ID'),
    (0, express_validator_1.body)('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    (0, express_validator_1.body)('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('role').optional(),
    (0, express_validator_1.body)('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], user_controller_1.updateUser);
// Change user password
router.put('/:id/change-password', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid user ID'),
    (0, express_validator_1.body)('currentPassword').optional(),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter')
        .matches(/\d/).withMessage('Password must contain at least one number')
], user_controller_1.changePassword);
// Delete user (admin only)
router.delete('/:id', auth_middleware_1.isAdmin, [(0, express_validator_1.param)('id').isUUID().withMessage('Invalid user ID')], user_controller_1.deleteUser);
exports.default = router;
