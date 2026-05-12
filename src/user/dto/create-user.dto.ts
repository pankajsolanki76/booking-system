import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'Pankaj Barot',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    example: 'pankaj@test.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '9876543210',
  })
  @IsString()
  phoneNumber!: string;

  @ApiProperty({
    example: 'Pass@123',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/)
  password!: string;
}
