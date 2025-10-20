import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam, 
  ApiQuery,
  ApiBody 
} from '@nestjs/swagger';
import { RoleService } from './role.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@ApiBearerAuth('admin-auth')
@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @Permissions('roles.create')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Project Manager' },
        description: { type: 'string', example: 'Manages projects and assigns tasks' },
        permissions: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
          description: 'Array of permission IDs (MongoDB ObjectIds). Use GET /roles/permissions/ids to get valid IDs.'
        },
        assignedAdmins: {
          type: 'array',
          items: { type: 'string' },
          example: ['507f1f77bcf86cd799439021', '507f1f77bcf86cd799439022'],
          description: 'Array of admin IDs to assign to this role immediately (optional). Use GET /admins to get valid admin IDs.'
        },
        priority: { 
          type: 'string', 
          enum: ['low', 'medium', 'high', 'critical'],
          example: 'medium'
        }
      },
      required: ['name', 'description']
    }
  })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Role name already exists' })
  async createRole(@Body() roleData: any, @Request() req) {
    return await this.roleService.createRole(roleData, req.user.adminId);
  }

  @Get()
  @Permissions('roles.view')
  @ApiOperation({ summary: 'Get all roles with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'isSystemRole', required: false, type: Boolean })
  @ApiQuery({ name: 'priority', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  async getAllRoles(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
    @Query('isSystemRole') isSystemRole?: boolean,
    @Query('priority') priority?: string
  ) {
    const filters = { search, isActive, isSystemRole, priority };
    return await this.roleService.getAllRoles(page, limit, filters);
  }

  @Get('permissions')
  @Permissions('roles.view')
  @ApiOperation({ summary: 'Get available permissions grouped by category' })
  @ApiResponse({ status: 200, description: 'Available permissions retrieved successfully' })
  async getAvailablePermissions() {
    return await this.roleService.getAvailablePermissions();
  }

  @Get('permissions/ids')
  @Permissions('roles.view')
  @ApiOperation({ summary: 'Get permission IDs for easy testing' })
  @ApiResponse({ status: 200, description: 'Permission IDs retrieved successfully' })
  async getPermissionIds() {
    return await this.roleService.getPermissionIds();
  }

  @Get('admins/ids')
  @Permissions('roles.view')
  @ApiOperation({ summary: 'Get admin IDs for easy role assignment' })
  @ApiResponse({ status: 200, description: 'Admin IDs retrieved successfully' })
  async getAdminIds() {
    return await this.roleService.getAdminIds();
  }

  @Get(':id')
  @Permissions('roles.view')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getRoleById(@Param('id') id: string) {
    return await this.roleService.getRoleById(id);
  }

  @Put(':id')
  @Permissions('roles.edit')
  @ApiOperation({ summary: 'Update role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Senior Project Manager' },
        description: { type: 'string', example: 'Senior level project management with additional permissions' },
        permissions: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013', '507f1f77bcf86cd799439014'],
          description: 'Array of permission IDs (MongoDB ObjectIds). Use GET /roles/permissions/ids to get valid IDs.'
        },
        priority: { 
          type: 'string', 
          enum: ['low', 'medium', 'high', 'critical'],
          example: 'high'
        },
        isActive: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Cannot update system roles' })
  @ApiResponse({ status: 409, description: 'Role name already exists' })
  async updateRole(@Param('id') id: string, @Body() updateData: any, @Request() req) {
    return await this.roleService.updateRole(id, updateData, req.user.adminId);
  }

  @Delete(':id')
  @Permissions('roles.delete')
  @ApiOperation({ summary: 'Delete role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete system roles or roles assigned to admins' })
  async deleteRole(@Param('id') id: string) {
    return await this.roleService.deleteRole(id);
  }

  @Post(':roleId/assign/:adminId')
  @Permissions('roles.assign')
  @ApiOperation({ summary: 'Assign role to admin' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiParam({ name: 'adminId', description: 'Admin ID' })
  @ApiResponse({ status: 200, description: 'Role assigned to admin successfully' })
  @ApiResponse({ status: 404, description: 'Role or admin not found' })
  @ApiResponse({ status: 409, description: 'Admin already has this role' })
  async assignRoleToAdmin(@Param('roleId') roleId: string, @Param('adminId') adminId: string) {
    return await this.roleService.assignRoleToAdmin(roleId, adminId);
  }

  @Delete(':roleId/remove/:adminId')
  @Permissions('roles.assign')
  @ApiOperation({ summary: 'Remove role from admin' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiParam({ name: 'adminId', description: 'Admin ID' })
  @ApiResponse({ status: 200, description: 'Role removed from admin successfully' })
  @ApiResponse({ status: 404, description: 'Role or admin not found' })
  async removeRoleFromAdmin(@Param('roleId') roleId: string, @Param('adminId') adminId: string) {
    return await this.roleService.removeRoleFromAdmin(roleId, adminId);
  }

  @Post(':roleId/permissions')
  @Permissions('roles.edit')
  @ApiOperation({ summary: 'Assign permissions to role' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        permissionIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
          description: 'Array of permission IDs (MongoDB ObjectIds). Use GET /roles/permissions/ids to get valid IDs.'
        }
      },
      required: ['permissionIds']
    }
  })
  @ApiResponse({ status: 200, description: 'Permissions assigned to role successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Invalid permission IDs' })
  async assignPermissionsToRole(@Param('roleId') roleId: string, @Body() body: { permissionIds: string[] }) {
    return await this.roleService.assignPermissionsToRole(roleId, body.permissionIds);
  }
}
