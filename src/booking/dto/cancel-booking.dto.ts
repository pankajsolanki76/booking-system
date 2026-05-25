import { IsArray, IsOptional, IsString } from 'class-validator';

export class CancelBookingDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seatIds?: string[];
}
