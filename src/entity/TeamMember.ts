import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Location } from './Location';
import { Schedule } from './Schedule';
import { IsString, IsDate } from 'class-validator';

/**
 * Team Member entity
 * This entity represents a team member who will service an appointment in the database.
 */
@Entity()
export class TeamMember {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @IsString()
  name!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @IsDate()
  created_at!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @IsDate()
  modified_at!: Date;

  @ManyToOne(() => Location, (location) => location.teamMembers)
  location!: Location;

  @OneToMany(() => Schedule, (schedule) => schedule.teamMember)
  schedules!: Schedule[];
}
