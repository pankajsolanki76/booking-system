import { IsInt, IsString, Min } from 'class-validator';

export class CreateScreenDto {
  @IsString()
  name!: string;

  @IsString()
  venueId!: string;

  @IsInt()
  @Min(1)
  totalSeats!: number;
}
