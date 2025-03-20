import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsNotEmpty, IsNumber, Min, IsDate } from 'class-validator';

export enum VoucherType {
  TENANT_BASED = 'tenant_based',
  PROJECT_BASED = 'project_based',
  HOMEOWNERSHIP = 'homeownership',
  EMERGENCY_HOUSING = 'emergency_housing',
  HUD_VASH = 'hud_vash',
  PERMANENT_SUPPORTIVE = 'permanent_supportive',
  MAINSTREAM = 'mainstream',
  SPECIAL_PURPOSE = 'special_purpose',
  MTW_FLEXIBLE = 'mtw_flexible',
  OTHER = 'other'
}

@Entity('hcv_utilization')
export class HCVUtilization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'date' })
  @IsNotEmpty({ message: 'Reporting date is required' })
  @IsDate({ message: 'Reporting date must be a valid date' })
  reportingDate!: Date;

  @Column({ 
    type: 'enum',
    enum: VoucherType
  })
  @IsNotEmpty({ message: 'Voucher type is required' })
  voucherType!: VoucherType;

  @Column({ type: 'int' })
  @IsNotEmpty({ message: 'Authorized vouchers is required' })
  @IsNumber({}, { message: 'Authorized vouchers must be a number' })
  @Min(0, { message: 'Authorized vouchers must be a positive number' })
  authorizedVouchers!: number;

  @Column({ type: 'int' })
  @IsNotEmpty({ message: 'Leased vouchers is required' })
  @IsNumber({}, { message: 'Leased vouchers must be a number' })
  @Min(0, { message: 'Leased vouchers must be a positive number' })
  leasedVouchers!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  @IsNotEmpty({ message: 'Utilization rate is required' })
  @IsNumber({}, { message: 'Utilization rate must be a number' })
  @Min(0, { message: 'Utilization rate must be a positive number' })
  utilizationRate!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  @IsNotEmpty({ message: 'HAP expenses is required' })
  @IsNumber({}, { message: 'HAP expenses must be a number' })
  @Min(0, { message: 'HAP expenses must be a positive number' })
  hapExpenses!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  @IsNumber({}, { message: 'Average HAP per unit must be a number' })
  @Min(0, { message: 'Average HAP per unit must be a positive number' })
  averageHapPerUnit!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  @IsNumber({}, { message: 'Budget utilization must be a number' })
  @Min(0, { message: 'Budget utilization must be a positive number' })
  budgetUtilization!: number;

  @Column({ length: 255, nullable: true })
  notes!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
