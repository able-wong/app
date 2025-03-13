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

@Entity()
export class Service {
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

  @ManyToOne(() => Location, (location) => location.services)
  location!: Location;

  @OneToMany(() => Schedule, (schedule) => schedule.service)
  schedules!: Schedule[];
}
