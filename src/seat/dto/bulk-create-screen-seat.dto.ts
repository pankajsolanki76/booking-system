import {
  IsInt,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { SeatType } from '@prisma/client';

export class BulkCreateScreenSeatDto {
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

  @Type(() => Number)
  @IsInt()
  @Min(1)
  numberOfSeats!: number;

  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  basePrice!: number;

  @IsOptional()
  @IsEnum(SeatType)
  type?: SeatType;
}
