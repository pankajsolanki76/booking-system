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
      inject: [ConfigService],

      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_ACCESS_SECRET') || 'access_secret',

        signOptions: {
          expiresIn: (configService.get<string>('JWT_ACCESS_EXPIRES_IN') ||
            '15m') as any,
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [AuthService, JwtStrategy, UserRepository],

  exports: [AuthService],
})
export class AuthModule {}
