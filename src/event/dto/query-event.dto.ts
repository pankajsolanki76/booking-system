import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import { Transform } from 'class-transformer';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryEventDto extends PaginationQueryDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'title', 'durationMins'])
  override sortBy?: string = 'createdAt';
}
