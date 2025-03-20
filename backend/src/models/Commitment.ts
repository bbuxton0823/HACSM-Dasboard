import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export enum CommitmentType {
  TRADITIONAL_HAP = 'traditional_hap',
  PUBLIC_HOUSING = 'public_housing',
  CAPITAL_FUND = 'capital_fund',
  LOCAL_NON_TRADITIONAL = 'local_non_traditional',
  HCV_ADMIN = 'hcv_admin',
  OTHER = 'other'
}

export enum CommitmentStatus {
  PLANNED = 'planned',
  COMMITTED = 'committed',
  OBLIGATED = 'obligated',
  PARTIALLY_EXPENDED = 'partially_expended',
  FULLY_EXPENDED = 'fully_expended',
  CANCELLED = 'cancelled'
}

@Entity('commitments')
export class Commitment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  @IsNotEmpty({ message: 'Commitment number is required' })
  commitmentNumber: string;

  @Column({ length: 255 })
  @IsNotEmpty({ message: 'Activity description is required' })
  activityDescription: string;

  @Column({ 
    type: 'enum',
    enum: CommitmentType
  })
  @IsNotEmpty({ message: 'Commitment type is required' })
  commitmentType: CommitmentType;

  @Column({ length: 100, nullable: true })
  accountType: string;

  @Column({ type: 'date', nullable: true })
  commitmentDate: Date | null;

  @Column({ type: 'date', nullable: true })
  obligationDate: Date | null;

  @Column({ 
    type: 'enum',
    enum: CommitmentStatus,
    default: CommitmentStatus.PLANNED
  })
  status: CommitmentStatus;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  @IsNotEmpty({ message: 'Amount committed is required' })
  @IsNumber({}, { message: 'Amount committed must be a number' })
  @Min(0, { message: 'Amount committed must be a positive number' })
  amountCommitted: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  amountObligated: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  amountExpended: number;

  @Column({ type: 'date', nullable: true })
  projectedFullExpenditureDate: Date | null;

  @Column({ length: 255, nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
