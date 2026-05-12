import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class LockSeatDto {
  @IsString()
  showId!: string;

  @IsArray()
  @ArrayNotEmpty()
  seatIds!: string[];
}
