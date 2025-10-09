import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminRole } from './admin.schema';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminRoleDto } from './dto/update-admin-role.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiBearerAuth('admin-auth')
@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('list')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all admins (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all admins' })
  async getAllAdmins() {
    return await this.adminService.getAllAdmins();
  }

  @Post('create')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new admin (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Admin created successfully' })
  async createAdmin(@Body() createAdminDto: CreateAdminDto, @Request() req) {
    return await this.adminService.createAdmin({
      ...createAdminDto,
      createdBy: req.user.adminId
    });
  }

  @Put(':id/role')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update admin role (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Admin ID' })
  @ApiResponse({ status: 200, description: 'Admin role updated successfully' })
  async updateAdminRole(
    @Param('id') adminId: string,
    @Body() updateRoleDto: UpdateAdminRoleDto,
    @Request() req
  ) {
    return await this.adminService.updateAdminRole(
      adminId,
      updateRoleDto.role,
      req.user.adminId
    );
  }

  @Put(':id/deactivate')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deactivate admin (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Admin ID' })
  @ApiResponse({ status: 200, description: 'Admin deactivated successfully' })
  async deactivateAdmin(@Param('id') adminId: string, @Request() req) {
    await this.adminService.deactivateAdmin(adminId, req.user.adminId);
    return { message: 'Admin deactivated successfully' };
  }

  @Put('change-password')
  @ApiOperation({ summary: 'Change admin password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  async changePassword(@Body() changePasswordDto: ChangePasswordDto, @Request() req) {
    await this.adminService.changePassword(req.user.adminId, changePasswordDto.newPassword);
    return { message: 'Password changed successfully' };
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current admin profile' })
  @ApiResponse({ status: 200, description: 'Admin profile' })
  async getProfile(@Request() req) {
    const admin = await this.adminService.findById(req.user.adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }
    
    return {
      id: admin._id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      lastLoginAt: admin.lastLoginAt,
      createdAt: (admin as any).createdAt
    };
  }
}
