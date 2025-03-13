import { IsString, IsNotEmpty } from 'class-validator';

export class CustomerDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
