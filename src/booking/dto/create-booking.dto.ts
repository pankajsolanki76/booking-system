import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  showId!: string;

  @IsArray()
  @ArrayNotEmpty()
  seatIds!: string[];
}
