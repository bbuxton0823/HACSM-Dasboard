import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export enum ExpenditureType {
  TRADITIONAL_HAP = 'traditional_hap',
  PUBLIC_HOUSING = 'public_housing',
  CAPITAL_FUND = 'capital_fund',
  LOCAL_NON_TRADITIONAL = 'local_non_traditional',
  HCV_ADMIN = 'hcv_admin',
  OTHER_1 = 'other_1',
  OTHER_2 = 'other_2',
  OTHER_3 = 'other_3'
}

@Entity('hap_expenditures')
export class HAPExpenditure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  @IsNotEmpty({ message: 'Expenditure date is required' })
  expenditureDate: Date;

  @Column({ 
    type: 'enum',
    enum: ExpenditureType
  })
  @IsNotEmpty({ message: 'Expenditure type is required' })
  expenditureType: ExpenditureType;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0, { message: 'Amount must be a positive number' })
  amount: number;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ length: 255, nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
