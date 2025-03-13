import { IsString, IsNotEmpty } from 'class-validator';

export class TeamMemberDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
