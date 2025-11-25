import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PublicFundingService } from './public-funding.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ApprovePaymentDto } from './dto/approve-payment.dto';
import { RejectPaymentDto } from './dto/reject-payment.dto';

@ApiBearerAuth('admin-auth')
@ApiTags('public-funding')
@Controller('public-funding')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PublicFundingController {
  constructor(private readonly publicFundingService: PublicFundingService) {}

  @Get('pending')
  @ApiOperation({ summary: 'Get all pending CashApp payments with receipts' })
  @ApiResponse({
    status: 200,
    description: 'Pending CashApp payments retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          projectId: { type: 'string' },
          amount: { type: 'number' },
          senderEmail: { type: 'string' },
          senderName: { type: 'string' },
          senderCountry: { type: 'string' },
          paymentChannel: { type: 'string', enum: ['CASHAPP'] },
          paymentStatus: { type: 'string', enum: ['PENDING'] },
          receiptUrl: { type: 'string' },
          transactionId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async getPendingCashAppPayments() {
    return this.publicFundingService.getPendingCashAppPayments();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific public funding payment details' })
  @ApiParam({ name: 'id', description: 'Public funding record ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        projectId: { type: 'string' },
        amount: { type: 'number' },
        senderEmail: { type: 'string' },
        senderName: { type: 'string' },
        senderCountry: { type: 'string' },
        paymentChannel: { type: 'string' },
        paymentStatus: { type: 'string' },
        receiptUrl: { type: 'string' },
        transactionId: { type: 'string' },
        adminApprovedBy: { type: 'string' },
        adminApprovedAt: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Payment record not found' })
  async getPublicFunding(@Param('id') id: string) {
    return this.publicFundingService.getPublicFundingById(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve CashApp payment (admin only)' })
  @ApiParam({ name: 'id', description: 'Public funding record ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment approved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        projectId: { type: 'string' },
        amount: { type: 'number' },
        paymentStatus: { type: 'string', enum: ['SUCCESS'] },
        adminApprovedBy: { type: 'string' },
        adminApprovedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request or payment already processed' })
  @ApiResponse({ status: 404, description: 'Payment record not found' })
  async approvePayment(
    @Param('id') id: string,
    @Body() dto: ApprovePaymentDto,
    @Request() req,
  ) {
    return this.publicFundingService.approvePayment(id, req.user.adminId, dto.reason);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject CashApp payment (admin only)' })
  @ApiParam({ name: 'id', description: 'Public funding record ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment rejected successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        projectId: { type: 'string' },
        amount: { type: 'number' },
        paymentStatus: { type: 'string', enum: ['FAILED'] },
        adminApprovedBy: { type: 'string' },
        adminApprovedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request or payment already processed' })
  @ApiResponse({ status: 404, description: 'Payment record not found' })
  async rejectPayment(
    @Param('id') id: string,
    @Body() dto: RejectPaymentDto,
    @Request() req,
  ) {
    return this.publicFundingService.rejectPayment(id, req.user.adminId, dto.reason);
  }
}

