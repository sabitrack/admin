import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminRole } from '../admin/admin.schema';

@ApiBearerAuth('admin-auth')
@ApiTags('audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Get audit logs with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiQuery({ name: 'adminId', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'targetUserId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Audit logs with pagination' })
  async getAuditLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('adminId') adminId?: string,
    @Query('action') action?: string,
    @Query('targetUserId') targetUserId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {
      adminId,
      action,
      targetUserId,
    };

    if (startDate) {
      filters.startDate = new Date(startDate);
    }
    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    return await this.auditService.getAuditLogs(page, limit, filters);
  }

  @Get('admin/:adminId')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get admin activity logs (Super Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({ status: 200, description: 'Admin activity logs' })
  async getAdminActivityLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Request() req
  ) {
    return await this.auditService.getAdminActivityLogs(req.params.adminId, page, limit);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user activity logs' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({ status: 200, description: 'User activity logs' })
  async getUserActivityLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Request() req
  ) {
    return await this.auditService.getUserActivityLogs(req.params.userId, page, limit);
  }

  @Get('stats')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get audit statistics (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Audit statistics' })
  async getAuditStats() {
    return await this.auditService.getAuditStats();
  }
}

