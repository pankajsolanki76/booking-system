import { ArrayNotEmpty, IsArray, IsString, MaxLength } from 'class-validator';

import { Transform } from 'class-transformer';

export class LockSeatDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  showId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({
    each: true,
  })
  @MaxLength(100, {
    each: true,
  })
  seatIds!: string[];
}
