import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import { ConfigModule, ConfigService } from '@nestjs/config';

import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { JwtStrategy } from './strategies/jwt.strategy';

import { UserModule } from '../user/user.module';
import { UserRepository } from '../user/user.repository';

@Module({
  imports: [
    UserModule,

    PassportModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: async (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_ACCESS_SECRET');

        const jwtExpiresIn = configService.get<string>('JWT_ACCESS_EXPIRES');

        if (!jwtSecret) {
          throw new Error('JWT_ACCESS_SECRET is missing');
        }

        if (!jwtExpiresIn) {
          throw new Error('JWT_ACCESS_EXPIRES is missing');
        }

        return {
          secret: jwtSecret,

          signOptions: {
            expiresIn: jwtExpiresIn as '1d',
          },
        };
      },
    }),
  ],

  controllers: [AuthController],

  providers: [AuthService, JwtStrategy, UserRepository],

  exports: [AuthService],
})
export class AuthModule {}
