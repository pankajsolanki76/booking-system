import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMins?: number;

  @IsOptional()
  @IsUrl()
  posterUrl?: string;

  @IsString()
  categoryId!: string;
}