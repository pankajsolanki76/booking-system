import { IsOptional, IsString } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryVenueDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'Rajkot',
  })
  @IsOptional()
  @IsString()
  city?: string;
}
