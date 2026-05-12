import { IsDateString, IsInt, IsString, Min } from 'class-validator';

export class CreateShowDto {
  @IsString()
  eventId!: string;

  @IsString()
  venueName!: string;

  @IsString()
  city!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsInt()
  @Min(1)
  totalSeats!: number;
}
