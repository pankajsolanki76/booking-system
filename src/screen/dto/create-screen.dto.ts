import { IsInt, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateScreenDto {
  @IsString()
  name!: string;

  @IsString()
  venueId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalSeats!: number;
}
