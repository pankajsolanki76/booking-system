import { IsOptional, IsString } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryEventDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'movie',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'CATEGORY_ID',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
