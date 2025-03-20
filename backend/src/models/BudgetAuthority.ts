import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

@Entity('budget_authority')
export class BudgetAuthority {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  @IsNotEmpty({ message: 'Total budget amount is required' })
  @IsNumber({}, { message: 'Total budget amount must be a number' })
  @Min(0, { message: 'Total budget amount must be a positive number' })
  totalBudgetAmount: number;

  @Column({ type: 'int' })
  @IsNotEmpty({ message: 'Fiscal year is required' })
  fiscalYear: number;

  @Column({ default: false })
  isActive: boolean;

  @Column({ type: 'date' })
  @IsNotEmpty({ message: 'Effective date is required' })
  effectiveDate: Date;
  
  @Column({ type: 'date', nullable: true })
  expirationDate: Date;
  
  @Column({ length: 255, nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
