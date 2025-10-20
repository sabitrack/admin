import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, AdminSchema } from './admin.schema';
import { Role, RoleSchema } from './role.schema';
import { Permission, PermissionSchema } from './permission.schema';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Permission.name, schema: PermissionSchema }
    ])
  ],
  controllers: [AdminController, RoleController, PermissionController],
  providers: [AdminService, RoleService, PermissionService],
  exports: [AdminService, RoleService, PermissionService]
})
export class AdminModule {}






