import { IsDateString, IsString } from 'class-validator';

export class CreateShowDto {
  @IsString()
  eventId!: string;

  @IsString()
  screenId!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;
}
