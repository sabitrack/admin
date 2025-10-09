import { SetMetadata } from '@nestjs/common';
import { AdminRole } from '../admin/admin.schema';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);
