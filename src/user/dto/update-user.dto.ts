import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Matches(/^[0-9]{10}$/)
  phoneNumber?: string;
}
