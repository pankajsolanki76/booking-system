import { IsIn, IsOptional, IsString } from 'class-validator';

import { Transform } from 'class-transformer';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryShowDto extends PaginationQueryDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsIn(['startTime', 'endTime', 'createdAt', 'updatedAt'])
  override sortBy?: string = 'startTime';
}
