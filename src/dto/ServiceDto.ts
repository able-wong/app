import { IsNotEmpty, IsString } from 'class-validator';

export class ServiceDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
