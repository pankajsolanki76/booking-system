import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Role } from '../../common/enums/role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

export function Auth(...roles: Role[]) {
  const decorators = [
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth('JWT-auth'),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  ];

  if (roles.length > 0) {
    decorators.push(Roles(...roles));
    decorators.push(ApiForbiddenResponse({ description: 'Forbidden' }));
  }

  return applyDecorators(...decorators);
}
