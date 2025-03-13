import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Service } from './Service';
import { User } from './User';
import { TeamMember } from './TeamMember';
import { IsString, IsDate } from 'class-validator';

@Entity()
export class Schedule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @IsString()
  date!: string;

  @Column()
  @IsString()
  time_period!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @IsDate()
  created_at!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @IsDate()
  modified_at!: Date;

  @ManyToOne(() => Service, (service) => service.schedules)
  service!: Service;

  @ManyToOne(() => User, (user) => user.schedules)
  user!: User;

  @ManyToOne(() => TeamMember, (teamMember) => teamMember.schedules)
  teamMember!: TeamMember;
}
