import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @Matches(/^[0-9]{10}$/)
  phoneNumber!: string;

  @MinLength(6)
  password!: string;
}