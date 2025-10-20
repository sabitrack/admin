import { 
  Controller, 
  Get, 
  Param, 
  UseGuards, 
  Query 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam, 
  ApiQuery 
} from '@nestjs/swagger';
import { PermissionService } from './permission.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@ApiBearerAuth('admin-auth')
@ApiTags('permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @Permissions('roles.view')
  @ApiOperation({ summary: 'Get all permissions grouped by category' })
  @ApiResponse({ 
    status: 200, 
    description: 'Permissions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Permissions retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            grouped: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                    permissionName: { type: 'string', example: 'users.view' },
                    description: { type: 'string', example: 'View user list and details' },
                    priority: { type: 'string', example: 'medium' }
                  }
                }
              }
            },
            allIds: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                  permissionName: { type: 'string', example: 'users.view' },
                  permissionGroup: { type: 'string', example: 'User Management' }
                }
              }
            }
          }
        }
      }
    }
  })
  async getPermissionsByGroup() {
    return await this.permissionService.getPermissionsByGroup();
  }

  @Get('all')
  @Permissions('roles.view')
  @ApiOperation({ summary: 'Get all permissions as a flat list' })
  @ApiResponse({ status: 200, description: 'All permissions retrieved successfully' })
  async getAllPermissions() {
    return await this.permissionService.getAllPermissions();
  }

  @Get('group/:groupName')
  @Permissions('roles.view')
  @ApiOperation({ summary: 'Get permissions by group name' })
  @ApiParam({ name: 'groupName', description: 'Permission group name' })
  @ApiResponse({ status: 200, description: 'Permissions for group retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async getPermissionsByGroupName(@Param('groupName') groupName: string) {
    return await this.permissionService.getPermissionsByGroupName(groupName);
  }
}
