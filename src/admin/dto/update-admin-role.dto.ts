import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AdminRole } from '../admin.schema';

export class UpdateAdminRoleDto {
  @ApiProperty({ enum: AdminRole, example: AdminRole.SUPER_ADMIN })
  @IsEnum(AdminRole)
  role: AdminRole;
}
