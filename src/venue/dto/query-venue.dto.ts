import { IsOptional, IsString, IsIn, MaxLength } from 'class-validator';

import { Transform } from 'class-transformer';

import { ApiPropertyOptional } from '@nestjs/swagger';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryVenueDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'Rajkot',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'name', 'city'])
  override sortBy?: string = 'createdAt';
}
