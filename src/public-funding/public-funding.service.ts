import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PublicFunding, PublicFundingDocument } from './public-funding.schema';
import { AdminService } from '../admin/admin.service';

@Injectable()
export class PublicFundingService {
  constructor(
    @InjectModel(PublicFunding.name)
    private publicFundingModel: Model<PublicFundingDocument>,
    private adminService: AdminService,
  ) {}

  async getPendingCashAppPayments() {
    const payments = await this.publicFundingModel
      .find({
        paymentChannel: 'CASHAPP',
        paymentStatus: 'PENDING',
        receiptUrl: { $exists: true, $ne: null },
      })
      .sort({ createdAt: -1 })
      .lean();

    return payments.map((payment) => ({
      id: payment._id.toString(),
      projectId: payment.projectId,
      amount: payment.amount,
      senderEmail: payment.senderEmail,
      senderName: payment.senderName,
      senderCountry: payment.senderCountry,
      paymentChannel: payment.paymentChannel,
      paymentStatus: payment.paymentStatus,
      receiptUrl: payment.receiptUrl,
      transactionId: payment.transactionId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));
  }

  async getPublicFundingById(id: string) {
    const payment = await this.publicFundingModel.findById(id).lean();

    if (!payment) {
      throw new NotFoundException('Public funding record not found');
    }

    return {
      id: payment._id.toString(),
      projectId: payment.projectId,
      amount: payment.amount,
      senderEmail: payment.senderEmail,
      senderName: payment.senderName,
      senderCountry: payment.senderCountry,
      paymentChannel: payment.paymentChannel,
      paymentStatus: payment.paymentStatus,
      receiptUrl: payment.receiptUrl,
      transactionId: payment.transactionId,
      adminApprovedBy: payment.adminApprovedBy,
      adminApprovedAt: payment.adminApprovedAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  async approvePayment(id: string, adminId: string, reason?: string) {
    const payment = await this.publicFundingModel.findById(id);

    if (!payment) {
      throw new NotFoundException('Public funding record not found');
    }

    // Validate it's a CashApp payment
    if (payment.paymentChannel !== 'CASHAPP') {
      throw new BadRequestException('Only CashApp payments can be approved through this endpoint');
    }

    // Validate it's pending
    if (payment.paymentStatus !== 'PENDING') {
      throw new BadRequestException(`Payment is already ${payment.paymentStatus}`);
    }

    // Validate receipt exists
    if (!payment.receiptUrl) {
      throw new BadRequestException('Payment receipt not submitted yet');
    }

    // Update payment status
    payment.paymentStatus = 'SUCCESS';
    payment.adminApprovedBy = adminId;
    payment.adminApprovedAt = new Date();
    await payment.save();

    // Log admin activity
    await this.adminService.logActivity(
      adminId,
      'APPROVE_CASHAPP_PAYMENT',
      `Approved CashApp payment ${id} for project ${payment.projectId}. Amount: ${payment.amount}. ${reason ? `Reason: ${reason}` : ''}`,
      'admin-api',
    );

    return {
      id: payment._id.toString(),
      projectId: payment.projectId,
      amount: payment.amount,
      senderEmail: payment.senderEmail,
      senderName: payment.senderName,
      senderCountry: payment.senderCountry,
      paymentChannel: payment.paymentChannel,
      paymentStatus: payment.paymentStatus,
      receiptUrl: payment.receiptUrl,
      transactionId: payment.transactionId,
      adminApprovedBy: payment.adminApprovedBy,
      adminApprovedAt: payment.adminApprovedAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  async rejectPayment(id: string, adminId: string, reason?: string) {
    const payment = await this.publicFundingModel.findById(id);

    if (!payment) {
      throw new NotFoundException('Public funding record not found');
    }

    // Validate it's a CashApp payment
    if (payment.paymentChannel !== 'CASHAPP') {
      throw new BadRequestException('Only CashApp payments can be rejected through this endpoint');
    }

    // Validate it's pending
    if (payment.paymentStatus !== 'PENDING') {
      throw new BadRequestException(`Payment is already ${payment.paymentStatus}`);
    }

    // Update payment status
    payment.paymentStatus = 'FAILED';
    payment.adminApprovedBy = adminId;
    payment.adminApprovedAt = new Date();
    await payment.save();

    // Log admin activity
    await this.adminService.logActivity(
      adminId,
      'REJECT_CASHAPP_PAYMENT',
      `Rejected CashApp payment ${id} for project ${payment.projectId}. Amount: ${payment.amount}. ${reason ? `Reason: ${reason}` : ''}`,
      'admin-api',
    );

    return {
      id: payment._id.toString(),
      projectId: payment.projectId,
      amount: payment.amount,
      senderEmail: payment.senderEmail,
      senderName: payment.senderName,
      senderCountry: payment.senderCountry,
      paymentChannel: payment.paymentChannel,
      paymentStatus: payment.paymentStatus,
      receiptUrl: payment.receiptUrl,
      transactionId: payment.transactionId,
      adminApprovedBy: payment.adminApprovedBy,
      adminApprovedAt: payment.adminApprovedAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}

