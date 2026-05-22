import { ArrayNotEmpty, ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  showId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(6)
  seatIds!: string[];
}

