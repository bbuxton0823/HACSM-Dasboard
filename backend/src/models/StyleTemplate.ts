import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('style_templates')
export class StyleTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @Column({ type: 'varchar', length: 255 })
  name: string = '';

  @Column({ type: 'text' })
  content: string = '';

  @Column({ type: 'varchar', length: 50, default: 'general' })
  category: string = 'general';

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();
}
