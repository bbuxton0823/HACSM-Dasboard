"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommitmentsByStatus = exports.getCommitmentsByType = exports.deleteCommitment = exports.updateCommitment = exports.createCommitment = exports.getCommitmentById = exports.getAllCommitments = void 0;
const database_1 = require("../config/database");
const Commitment_1 = require("../models/Commitment");
const class_validator_1 = require("class-validator");
// Commitment repository
const commitmentRepository = database_1.AppDataSource.getRepository(Commitment_1.Commitment);
// Get all commitments
const getAllCommitments = async (req, res) => {
    try {
        const commitments = await commitmentRepository.find({
            order: { commitmentDate: 'DESC' }
        });
        res.status(200).json({
            status: 'success',
            data: commitments
        });
        return;
    }
    catch (error) {
        console.error('Get all commitments error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get commitments'
        });
        return;
    }
};
exports.getAllCommitments = getAllCommitments;
// Get commitment by ID
const getCommitmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const commitment = await commitmentRepository.findOne({
            where: { id }
        });
        if (!commitment) {
            res.status(404).json({
                status: 'error',
                message: 'Commitment not found'
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            data: commitment
        });
        return;
    }
    catch (error) {
        console.error('Get commitment by ID error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get commitment'
        });
        return;
    }
};
exports.getCommitmentById = getCommitmentById;
// Create commitment
const createCommitment = async (req, res) => {
    try {
        const { commitmentNumber, activityDescription, commitmentType, accountType, commitmentDate, obligationDate, status, amountCommitted, amountObligated, amountExpended, projectedFullExpenditureDate, notes } = req.body;
        // Create new commitment
        const commitment = new Commitment_1.Commitment();
        commitment.commitmentNumber = commitmentNumber;
        commitment.activityDescription = activityDescription;
        commitment.commitmentType = commitmentType;
        if (accountType)
            commitment.accountType = accountType;
        if (commitmentDate)
            commitment.commitmentDate = new Date(commitmentDate);
        if (obligationDate)
            commitment.obligationDate = new Date(obligationDate);
        if (status)
            commitment.status = status;
        commitment.amountCommitted = amountCommitted;
        if (amountObligated !== undefined)
            commitment.amountObligated = amountObligated;
        if (amountExpended !== undefined)
            commitment.amountExpended = amountExpended;
        if (projectedFullExpenditureDate)
            commitment.projectedFullExpenditureDate = new Date(projectedFullExpenditureDate);
        if (notes)
            commitment.notes = notes;
        // Validate commitment data
        const errors = await (0, class_validator_1.validate)(commitment);
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
        // Save commitment to database
        await commitmentRepository.save(commitment);
        res.status(201).json({
            status: 'success',
            message: 'Commitment created successfully',
            data: commitment
        });
        return;
    }
    catch (error) {
        console.error('Create commitment error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create commitment'
        });
        return;
    }
};
exports.createCommitment = createCommitment;
// Update commitment
const updateCommitment = async (req, res) => {
    try {
        const { id } = req.params;
        const { commitmentNumber, activityDescription, commitmentType, accountType, commitmentDate, obligationDate, status, amountCommitted, amountObligated, amountExpended, projectedFullExpenditureDate, notes } = req.body;
        // Find commitment
        const commitment = await commitmentRepository.findOne({
            where: { id }
        });
        if (!commitment) {
            res.status(404).json({
                status: 'error',
                message: 'Commitment not found'
            });
            return;
        }
        // Update commitment fields
        if (commitmentNumber !== undefined)
            commitment.commitmentNumber = commitmentNumber;
        if (activityDescription !== undefined)
            commitment.activityDescription = activityDescription;
        if (commitmentType !== undefined)
            commitment.commitmentType = commitmentType;
        if (accountType !== undefined)
            commitment.accountType = accountType;
        if (commitmentDate !== undefined)
            commitment.commitmentDate = commitmentDate ? new Date(commitmentDate) : null;
        if (obligationDate !== undefined)
            commitment.obligationDate = obligationDate ? new Date(obligationDate) : null;
        if (status !== undefined)
            commitment.status = status;
        if (amountCommitted !== undefined)
            commitment.amountCommitted = amountCommitted;
        if (amountObligated !== undefined)
            commitment.amountObligated = amountObligated;
        if (amountExpended !== undefined)
            commitment.amountExpended = amountExpended;
        if (projectedFullExpenditureDate !== undefined) {
            commitment.projectedFullExpenditureDate = projectedFullExpenditureDate
                ? new Date(projectedFullExpenditureDate)
                : null;
        }
        if (notes !== undefined)
            commitment.notes = notes;
        // Validate updated commitment data
        const errors = await (0, class_validator_1.validate)(commitment);
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
        // Save updated commitment
        await commitmentRepository.save(commitment);
        res.status(200).json({
            status: 'success',
            message: 'Commitment updated successfully',
            data: commitment
        });
        return;
    }
    catch (error) {
        console.error('Update commitment error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update commitment'
        });
        return;
    }
};
exports.updateCommitment = updateCommitment;
// Delete commitment
const deleteCommitment = async (req, res) => {
    try {
        const { id } = req.params;
        // Find commitment
        const commitment = await commitmentRepository.findOne({
            where: { id }
        });
        if (!commitment) {
            res.status(404).json({
                status: 'error',
                message: 'Commitment not found'
            });
            return;
        }
        // Delete commitment
        await commitmentRepository.remove(commitment);
        res.status(200).json({
            status: 'success',
            message: 'Commitment deleted successfully'
        });
        return;
    }
    catch (error) {
        console.error('Delete commitment error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete commitment'
        });
        return;
    }
};
exports.deleteCommitment = deleteCommitment;
// Get commitments by type
const getCommitmentsByType = async (req, res) => {
    try {
        const { type } = req.params;
        // Validate type
        if (!Object.values(Commitment_1.CommitmentType).includes(type)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid commitment type'
            });
            return;
        }
        const commitments = await commitmentRepository.find({
            where: { commitmentType: type },
            order: { commitmentDate: 'DESC' }
        });
        res.status(200).json({
            status: 'success',
            data: commitments
        });
        return;
    }
    catch (error) {
        console.error('Get commitments by type error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get commitments by type'
        });
        return;
    }
};
exports.getCommitmentsByType = getCommitmentsByType;
// Get commitments by status
const getCommitmentsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        // Validate status
        if (!Object.values(Commitment_1.CommitmentStatus).includes(status)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid commitment status'
            });
            return;
        }
        const commitments = await commitmentRepository.find({
            where: { status: status },
            order: { commitmentDate: 'DESC' }
        });
        res.status(200).json({
            status: 'success',
            data: commitments
        });
        return;
    }
    catch (error) {
        console.error('Get commitments by status error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get commitments by status'
        });
        return;
    }
};
exports.getCommitmentsByStatus = getCommitmentsByStatus;
