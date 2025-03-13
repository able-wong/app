import { IsString } from 'class-validator';

export class ScheduleDto {
  @IsString()
  date!: string;

  @IsString()
  time_period!: string;
}
