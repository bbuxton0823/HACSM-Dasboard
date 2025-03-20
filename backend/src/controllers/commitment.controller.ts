import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Commitment, CommitmentStatus, CommitmentType } from '../models/Commitment';
import { validate } from 'class-validator';

// Commitment repository
const commitmentRepository = AppDataSource.getRepository(Commitment);

// Get all commitments
export const getAllCommitments = async (req: Request, res: Response): Promise<void> => {
  try {
    const commitments = await commitmentRepository.find({
      order: { commitmentDate: 'DESC' }
    });
    
    res.status(200).json({
      status: 'success',
      data: commitments
    });
    return;
  } catch (error) {
    console.error('Get all commitments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get commitments'
    });
    return;
  }
};

// Get commitment by ID
export const getCommitmentById = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    console.error('Get commitment by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get commitment'
    });
    return;
  }
};

// Create commitment
export const createCommitment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      commitmentNumber, 
      activityDescription, 
      commitmentType, 
      accountType,
      commitmentDate,
      obligationDate,
      status,
      amountCommitted,
      amountObligated,
      amountExpended,
      projectedFullExpenditureDate,
      notes
    } = req.body;
    
    // Create new commitment
    const commitment = new Commitment();
    commitment.commitmentNumber = commitmentNumber;
    commitment.activityDescription = activityDescription;
    commitment.commitmentType = commitmentType;
    if (accountType) commitment.accountType = accountType;
    if (commitmentDate) commitment.commitmentDate = new Date(commitmentDate);
    if (obligationDate) commitment.obligationDate = new Date(obligationDate);
    if (status) commitment.status = status;
    commitment.amountCommitted = amountCommitted;
    if (amountObligated !== undefined) commitment.amountObligated = amountObligated;
    if (amountExpended !== undefined) commitment.amountExpended = amountExpended;
    if (projectedFullExpenditureDate) commitment.projectedFullExpenditureDate = new Date(projectedFullExpenditureDate);
    if (notes) commitment.notes = notes;
    
    // Validate commitment data
    const errors = await validate(commitment);
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
  } catch (error) {
    console.error('Create commitment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create commitment'
    });
    return;
  }
};

// Update commitment
export const updateCommitment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      commitmentNumber, 
      activityDescription, 
      commitmentType, 
      accountType,
      commitmentDate,
      obligationDate,
      status,
      amountCommitted,
      amountObligated,
      amountExpended,
      projectedFullExpenditureDate,
      notes
    } = req.body;
    
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
    if (commitmentNumber !== undefined) commitment.commitmentNumber = commitmentNumber;
    if (activityDescription !== undefined) commitment.activityDescription = activityDescription;
    if (commitmentType !== undefined) commitment.commitmentType = commitmentType;
    if (accountType !== undefined) commitment.accountType = accountType;
    if (commitmentDate !== undefined) commitment.commitmentDate = commitmentDate ? new Date(commitmentDate) : null;
    if (obligationDate !== undefined) commitment.obligationDate = obligationDate ? new Date(obligationDate) : null;
    if (status !== undefined) commitment.status = status;
    if (amountCommitted !== undefined) commitment.amountCommitted = amountCommitted;
    if (amountObligated !== undefined) commitment.amountObligated = amountObligated;
    if (amountExpended !== undefined) commitment.amountExpended = amountExpended;
    if (projectedFullExpenditureDate !== undefined) {
      commitment.projectedFullExpenditureDate = projectedFullExpenditureDate 
        ? new Date(projectedFullExpenditureDate) 
        : null;
    }
    if (notes !== undefined) commitment.notes = notes;
    
    // Validate updated commitment data
    const errors = await validate(commitment);
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
  } catch (error) {
    console.error('Update commitment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update commitment'
    });
    return;
  }
};

// Delete commitment
export const deleteCommitment = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    console.error('Delete commitment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete commitment'
    });
    return;
  }
};

// Get commitments by type
export const getCommitmentsByType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.params;
    
    // Validate type
    if (!Object.values(CommitmentType).includes(type as CommitmentType)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid commitment type'
      });
      return;
    }
    
    const commitments = await commitmentRepository.find({
      where: { commitmentType: type as CommitmentType },
      order: { commitmentDate: 'DESC' }
    });
    
    res.status(200).json({
      status: 'success',
      data: commitments
    });
    return;
  } catch (error) {
    console.error('Get commitments by type error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get commitments by type'
    });
    return;
  }
};

// Get commitments by status
export const getCommitmentsByStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.params;
    
    // Validate status
    if (!Object.values(CommitmentStatus).includes(status as CommitmentStatus)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid commitment status'
      });
      return;
    }
    
    const commitments = await commitmentRepository.find({
      where: { status: status as CommitmentStatus },
      order: { commitmentDate: 'DESC' }
    });
    
    res.status(200).json({
      status: 'success',
      data: commitments
    });
    return;
  } catch (error) {
    console.error('Get commitments by status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get commitments by status'
    });
    return;
  }
};
