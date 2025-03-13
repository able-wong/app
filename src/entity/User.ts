import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Schedule } from './Schedule';
import { IsString, IsInt, IsDate } from 'class-validator';

/**
 * User entity
 * This entity represents a user who book an appointment in the database.
 */
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @IsString()
  firstName!: string;

  @Column()
  @IsString()
  lastName!: string;

  @Column()
  @IsInt()
  age!: number;

  @Column()
  @IsInt()
  customer_id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @IsDate()
  created_at!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @IsDate()
  modified_at!: Date;

  @OneToMany(() => Schedule, (schedule) => schedule.user)
  schedules!: Schedule[];
}
