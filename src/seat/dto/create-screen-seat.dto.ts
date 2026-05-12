import { IsNumber, IsString, Min } from 'class-validator';

export class CreateScreenSeatDto {
  @IsString()
  screenId!: string;

  @IsString()
  seatNumber!: string;

  @IsString()
  rowLabel!: string;

  @IsNumber()
  @Min(0)
  price!: number;
}
