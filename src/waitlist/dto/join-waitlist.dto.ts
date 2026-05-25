import { IsString, IsNotEmpty } from 'class-validator';

export class JoinWaitlistDto {
  @IsString()
  @IsNotEmpty()
  showId: string;
}
