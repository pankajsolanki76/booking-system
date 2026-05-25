import { IsDateString, IsString, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';

import { Transform, Type } from 'class-transformer';

export class CustomPriceOverrideDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  rowLabel!: string;

  @Type(() => Number)
  @IsNumber()
  price!: number;
}

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

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  priceMultiplier?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomPriceOverrideDto)
  customPrices?: CustomPriceOverrideDto[];
}
