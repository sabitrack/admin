import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminRole } from '../admin/admin.schema';

@ApiBearerAuth('admin-auth')
@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard data with key metrics and user activity' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date filter (YYYY-MM-DD)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Dashboard data retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            keyMetrics: {
              type: 'object',
              properties: {
                totalRevenue: {
                  type: 'object',
                  properties: {
                    value: { type: 'number', example: 500200983 },
                    formatted: { type: 'string', example: '₦500,200,983.00' },
                    change: { type: 'number', example: 3.24 },
                    changeText: { type: 'string', example: '↑3.24% vs last period' }
                  }
                },
                totalProjectSponsored: {
                  type: 'object',
                  properties: {
                    value: { type: 'number', example: 5000 },
                    formatted: { type: 'string', example: '5,000' },
                    change: { type: 'number', example: 3.24 },
                    changeText: { type: 'string', example: '↑3.24% vs last period' }
                  }
                },
                totalProjectSponsors: {
                  type: 'object',
                  properties: {
                    value: { type: 'number', example: 5000 },
                    formatted: { type: 'string', example: '5,000' },
                    change: { type: 'number', example: 3.24 },
                    changeText: { type: 'string', example: '↑3.24% vs last period' }
                  }
                },
                totalVendors: {
                  type: 'object',
                  properties: {
                    value: { type: 'number', example: 5000 },
                    formatted: { type: 'string', example: '5,000' },
                    change: { type: 'number', example: 3.24 },
                    changeText: { type: 'string', example: '↑3.24% vs last period' }
                  }
                },
                totalTransactions: {
                  type: 'object',
                  properties: {
                    value: { type: 'number', example: 100200983 },
                    formatted: { type: 'string', example: '100,200,983' },
                    change: { type: 'number', example: 3.24 },
                    changeText: { type: 'string', example: '↑3.24% vs last period' }
                  }
                },
                activeProjectSponsors: {
                  type: 'object',
                  properties: {
                    value: { type: 'number', example: 5000 },
                    formatted: { type: 'string', example: '5,000' },
                    change: { type: 'number', example: 3.24 },
                    changeText: { type: 'string', example: '↑3.24% vs last period' }
                  }
                },
                activeVendors: {
                  type: 'object',
                  properties: {
                    value: { type: 'number', example: 5000 },
                    formatted: { type: 'string', example: '5,000' },
                    change: { type: 'number', example: 3.24 },
                    changeText: { type: 'string', example: '↑3.24% vs last period' }
                  }
                }
              }
            },
            userActivity: {
              type: 'object',
              properties: {
                months: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      month: { type: 'string', example: 'January' },
                      year: { type: 'number', example: 2024 },
                      projectSponsors: { type: 'number', example: 4328 },
                      vendors: { type: 'number', example: 2156 }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  async getDashboardData(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const filters = { startDate, endDate };
    return this.dashboardService.getDashboardData(req.user.adminId, filters);
  }
}
