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
  ApiQuery 
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminRole } from '../admin/admin.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { UpdateVerificationStatusDto } from './dto/update-verification-status.dto';
import { GrantAdminDto } from './dto/grant-admin.dto';

@ApiBearerAuth('admin-auth')
@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'userType', required: false, type: String })
  @ApiQuery({ name: 'verificationStatus', required: false, type: String })
  @ApiQuery({ name: 'isBanned', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of users with pagination' })
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('userType') userType?: string,
    @Query('verificationStatus') verificationStatus?: string,
    @Query('isBanned') isBanned?: boolean,
  ) {
    const filters = {
      search,
      userType,
      verificationStatus,
      isBanned,
    };
    return await this.usersService.getAllUsers(page, limit, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    return await this.usersService.getUserById(id);
  }

  @Post()
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new user (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async createUser(@Body() createUserDto: CreateUserDto, @Request() req) {
    return await this.usersService.createUser(createUserDto, req.user.adminId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req
  ) {
    return await this.usersService.updateUser(id, updateUserDto, req.user.adminId);
  }

  @Delete(':id')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete user (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: string, @Request() req) {
    await this.usersService.deleteUser(id, req.user.adminId);
    return { message: 'User deleted successfully' };
  }

  @Post(':id/ban')
  @ApiOperation({ summary: 'Ban/suspend user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User banned successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async banUser(
    @Param('id') id: string,
    @Body() banUserDto: BanUserDto,
    @Request() req
  ) {
    return await this.usersService.banUser(id, banUserDto, req.user.adminId);
  }

  @Post(':id/unban')
  @ApiOperation({ summary: 'Unban user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User unbanned successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async unbanUser(@Param('id') id: string, @Request() req) {
    return await this.usersService.unbanUser(id, req.user.adminId);
  }

  @Put(':id/verification-status')
  @ApiOperation({ summary: 'Update user verification status' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Verification status updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateVerificationStatus(
    @Param('id') id: string,
    @Body() updateVerificationDto: UpdateVerificationStatusDto,
    @Request() req
  ) {
    return await this.usersService.updateVerificationStatus(id, updateVerificationDto, req.user.adminId);
  }

  @Post(':id/grant-admin')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Grant admin privileges to user (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Admin privileges granted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async grantAdminRole(
    @Param('id') id: string,
    @Body() grantAdminDto: GrantAdminDto,
    @Request() req
  ) {
    return await this.usersService.grantAdminRole(id, grantAdminDto, req.user.adminId);
  }

  @Post(':id/revoke-admin')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Revoke admin privileges from user (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Admin privileges revoked successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async revokeAdminRole(@Param('id') id: string, @Request() req) {
    return await this.usersService.revokeAdminRole(id, req.user.adminId);
  }

  @Get(':id/activity-logs')
  @ApiOperation({ summary: 'Get user activity logs' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User activity logs' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserActivityLogs(@Param('id') id: string) {
    return await this.usersService.getUserActivityLogs(id);
  }
}
