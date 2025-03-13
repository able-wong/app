import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Customer } from './Customer';
import { Service } from './Service';
import { TeamMember } from './TeamMember';
import { IsString, IsDate } from 'class-validator';

@Entity()
export class Location {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @IsString()
  name!: string;

  @Column()
  @IsString()
  address!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @IsDate()
  created_at!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @IsDate()
  modified_at!: Date;

  @ManyToOne(() => Customer, (customer) => customer.locations)
  customer!: Customer;

  @OneToMany(() => Service, (service) => service.location)
  services!: Service[];

  @OneToMany(() => TeamMember, (teamMember) => teamMember.location)
  teamMembers!: TeamMember[];
}
