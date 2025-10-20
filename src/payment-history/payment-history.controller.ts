import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentHistoryService } from './payment-history.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiBearerAuth('admin-auth')
@ApiTags('payment-history')
@Controller('payment-history')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentHistoryController {
  constructor(private readonly paymentHistoryService: PaymentHistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get payment history with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 12 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by invoice ID or recipient name' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by specific user ID' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by payment status' })
  @ApiQuery({ name: 'paymentMethod', required: false, type: String, description: 'Filter by payment method' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort by field (date, amount, status)' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort order (asc, desc)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment history retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Payment history retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            payments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'INV001234' },
                  invoiceId: { type: 'string', example: '#INV001234' },
                  recipient: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string', example: 'Rayo Sabitrack' },
                      avatar: { type: 'string', example: 'https://example.com/avatar.jpg' },
                      email: { type: 'string', example: 'rayo@sabitrack.com' }
                    }
                  },
                  paymentMethod: { type: 'string', example: 'Bank Account' },
                  amount: {
                    type: 'object',
                    properties: {
                      value: { type: 'number', example: 10000 },
                      currency: { type: 'string', example: 'NGN' },
                      formatted: { type: 'string', example: '₦10,000.00' }
                    }
                  },
                  paymentDate: { type: 'string', example: '2024-12-14T04:39:53.000Z' },
                  status: { 
                    type: 'string', 
                    enum: ['successful', 'pending', 'failed', 'cancelled'],
                    example: 'successful'
                  },
                  statusBadge: {
                    type: 'object',
                    properties: {
                      text: { type: 'string', example: 'Successful' },
                      color: { type: 'string', example: 'green' }
                    }
                  },
                  actions: {
                    type: 'object',
                    properties: {
                      canView: { type: 'boolean', example: true },
                      canDelete: { type: 'boolean', example: true },
                      canEdit: { type: 'boolean', example: false }
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
                    paymentMethods: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  async getPaymentHistory(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 12,
    @Query('search') search?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string
  ) {
    const filters = {
      search,
      userId,
      status,
      paymentMethod,
      startDate,
      endDate,
      sortBy: sortBy || 'paymentDate',
      sortOrder: sortOrder || 'desc'
    };
    
    return this.paymentHistoryService.getPaymentHistory(page, limit, filters, req.user.adminId);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export payment history data' })
  @ApiQuery({ name: 'format', required: false, type: String, description: 'Export format (csv, excel, pdf)' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Payment history exported successfully' })
  async exportPaymentHistory(
    @Request() req,
    @Query('format') format: string = 'csv',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string
  ) {
    const filters = { startDate, endDate, status };
    return this.paymentHistoryService.exportPaymentHistory(format, filters, req.user.adminId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get payment history statistics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Payment statistics retrieved successfully' })
  async getPaymentStatistics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const filters = { startDate, endDate };
    return this.paymentHistoryService.getPaymentStatistics(filters, req.user.adminId);
  }
}
