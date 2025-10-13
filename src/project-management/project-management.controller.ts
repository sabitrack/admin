import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProjectManagementService } from './project-management.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminRole } from '../admin/admin.schema';

@ApiBearerAuth('admin-auth')
@ApiTags('project-management')
@Controller('project-management')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectManagementController {
  constructor(private readonly projectManagementService: ProjectManagementService) {}

  @Get()
  @ApiOperation({ summary: 'Get project management data with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 12 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by project name or ID' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by project status' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort by field (name, date, budget, status)' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort order (asc, desc)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Project management data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Project management data retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            projects: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'PRO001234' },
                  projectId: { type: 'string', example: '#PRO001234' },
                  projectName: { type: 'string', example: 'Office Redesign Project' },
                  description: { type: 'string', example: 'Complete office redesign and renovation' },
                  timeline: {
                    type: 'object',
                    properties: {
                      startDate: { type: 'string', example: '2024-12-14' },
                      endDate: { type: 'string', example: '2025-01-14' },
                      formatted: { type: 'string', example: '2024/12/14 - 2025/01/14' },
                      duration: { type: 'number', example: 31 }
                    }
                  },
                  totalBudget: {
                    type: 'object',
                    properties: {
                      value: { type: 'number', example: 10000 },
                      currency: { type: 'string', example: 'NGN' },
                      formatted: { type: 'string', example: '₦10,000.00' }
                    }
                  },
                  overallStatus: { 
                    type: 'string', 
                    enum: ['draft', 'pending', 'in_progress', 'completed', 'cancelled', 'on_hold'],
                    example: 'in_progress'
                  },
                  statusBadge: {
                    type: 'object',
                    properties: {
                      text: { type: 'string', example: 'In Progress' },
                      color: { type: 'string', example: 'purple' }
                    }
                  },
                  progress: {
                    type: 'object',
                    properties: {
                      percentage: { type: 'number', example: 65 },
                      milestones: { type: 'number', example: 5 },
                      completedMilestones: { type: 'number', example: 3 }
                    }
                  },
                  team: {
                    type: 'object',
                    properties: {
                      sponsor: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string', example: 'John Doe' },
                          email: { type: 'string', example: 'john@example.com' }
                        }
                      },
                      vendor: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string', example: 'Jane Smith' },
                          email: { type: 'string', example: 'jane@example.com' }
                        }
                      }
                    }
                  },
                  actions: {
                    type: 'object',
                    properties: {
                      canView: { type: 'boolean', example: true },
                      canEdit: { type: 'boolean', example: true },
                      canDelete: { type: 'boolean', example: false },
                      canManage: { type: 'boolean', example: true }
                    }
                  }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                currentPage: { type: 'number', example: 1 },
                totalPages: { type: 'number', example: 16 },
                totalItems: { type: 'number', example: 200 },
                itemsPerPage: { type: 'number', example: 12 },
                hasNext: { type: 'boolean', example: true },
                hasPrev: { type: 'boolean', example: false }
              }
            },
            filters: {
              type: 'object',
              properties: {
                applied: { type: 'object' },
                available: {
                  type: 'object',
                  properties: {
                    statuses: { type: 'array', items: { type: 'string' } },
                    dateRanges: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  async getProjectManagement(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 12,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string
  ) {
    const filters = {
      search,
      status,
      startDate,
      endDate,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };
    
    return this.projectManagementService.getProjectManagement(page, limit, filters, req.user.adminId);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export project management data' })
  @ApiQuery({ name: 'format', required: false, type: String, description: 'Export format (csv, excel, pdf)' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Project management data exported successfully' })
  async exportProjectManagement(
    @Request() req,
    @Query('format') format: string = 'csv',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string
  ) {
    const filters = { startDate, endDate, status };
    return this.projectManagementService.exportProjectManagement(format, filters, req.user.adminId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get project management statistics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Project statistics retrieved successfully' })
  async getProjectStatistics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const filters = { startDate, endDate };
    return this.projectManagementService.getProjectStatistics(filters, req.user.adminId);
  }
}
