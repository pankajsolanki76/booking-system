import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { ConfigService } from '@nestjs/config';

import * as bcrypt from 'bcrypt';

import { LoginDto } from './dto/login.dto';

import { UserRepository } from '../user/user.repository';

import { TokenPayload } from './interfaces/token-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,

    private readonly jwtService: JwtService,

    private readonly configService: ConfigService,
  ) {}

  private async generateAccessToken(payload: TokenPayload) {
    return this.jwtService.signAsync(
      payload,

      {
        secret:
          this.configService.get<string>('JWT_ACCESS_SECRET') ||
          'access_secret',

        expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ||
          '15m') as any,
      },
    );
  }

  private async generateRefreshToken(payload: TokenPayload) {
    return this.jwtService.signAsync(
      payload,

      {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'refresh_secret',

        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ||
          '7d') as any,
      },
    );
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: TokenPayload = {
      sub: user.id,

      email: user.email,

      role: user.role,
    };

    const accessToken = await this.generateAccessToken(payload);

    const refreshToken = await this.generateRefreshToken(payload);

    return {
      message: 'Login successful',

      accessToken,

      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(
        refreshToken,

        {
          secret:
            this.configService.get<string>('JWT_REFRESH_SECRET') ||
            'refresh_secret',
        },
      );

      const newPayload: TokenPayload = {
        sub: payload.sub,

        email: payload.email,

        role: payload.role,
      };

      const accessToken = await this.generateAccessToken(newPayload);

      const newRefreshToken = await this.generateRefreshToken(newPayload);

      return {
        accessToken,

        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
