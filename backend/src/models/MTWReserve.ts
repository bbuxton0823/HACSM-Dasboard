import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

@Entity('mtw_reserves')
export class MTWReserve {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  @IsNotEmpty({ message: 'Reserve amount is required' })
  @IsNumber({}, { message: 'Reserve amount must be a number' })
  @Min(0, { message: 'Reserve amount must be a positive number' })
  reserveAmount: number;

  @Column({ type: 'date' })
  @IsNotEmpty({ message: 'As of date is required' })
  asOfDate: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentageOfBudgetAuthority: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  minimumReserveLevel: number;

  @Column({ length: 255, nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
