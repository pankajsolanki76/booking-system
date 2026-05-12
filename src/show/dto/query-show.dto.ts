import { IsOptional, IsString } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryShowDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'EVENT_ID',
  })
  @IsOptional()
  @IsString()
  eventId?: string;
}
