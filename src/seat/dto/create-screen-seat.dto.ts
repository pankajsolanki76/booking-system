import {
  IsInt,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { Transform } from 'class-transformer';

export class CreateScreenSeatDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  screenId!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(5)
  rowLabel!: string;

  @IsInt()
  @Min(1)
  seatNumber!: number;

  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  price!: number;
}
