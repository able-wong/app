import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class ScheduleDto {
  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @IsString()
  @IsNotEmpty()
  time_period!: string;
}
