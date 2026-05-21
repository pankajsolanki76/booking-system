import { IsOptional, IsString, MaxLength } from 'class-validator';

import { Transform } from 'class-transformer';

export class QueryCategoryDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(50)
  search?: string;
}
