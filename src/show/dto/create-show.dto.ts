import { IsDateString, IsString } from 'class-validator';

import { Transform } from 'class-transformer';

export class CreateShowDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  eventId!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  screenId!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;
}
