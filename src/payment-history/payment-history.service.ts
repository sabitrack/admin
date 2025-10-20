import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/user.schema';
import { Transaction, TransactionDocument } from './transaction.schema';

@Injectable()
export class PaymentHistoryService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {}

  /**
   * Get payment history with pagination and filters
   */
  async getPaymentHistory(page: number, limit: number, filters: any, adminId: string) {
    try {
      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Build query for real transactions
      const query: any = {};
      
      // Filter by userId if provided in filters
      if (filters.userId) {
        query.userId = filters.userId;
      }
      
      // Apply other filters to the database query
      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.paymentMethod) {
        query.channel = { $regex: filters.paymentMethod, $options: 'i' };
      }

      if (filters.startDate || filters.endDate) {
        query.date = {};
        if (filters.startDate) {
          query.date.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.date.$lte = new Date(filters.endDate);
        }
      }

      // Get transactions with pagination
      const transactions = await this.transactionModel
        .find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Get total count for pagination
      const totalItems = await this.transactionModel.countDocuments(query);
      const totalPages = Math.ceil(totalItems / limit);

      return {
        status: 'success',
        message: 'Payment history retrieved successfully',
        data: {
          payments: transactions,
          pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalItems: totalItems,
            itemsPerPage: limit,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      };
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw new BadRequestException('Failed to get payment history');
    }
  }

  /**
   * Convert channel to user-friendly payment method display
   */
  private getPaymentMethodDisplay(channel: string): string {
    const methodMap: { [key: string]: string } = {
      'internal_transfer': 'Internal Transfer',
      'bank': 'Bank Account',
      'card': 'Debit Card',
      'credit_card': 'Credit Card',
      'paypal': 'PayPal',
      'stripe': 'Stripe',
      'bank_transfer': 'Bank Transfer',
      'mobile_money': 'Mobile Money'
    };
    
    return methodMap[channel] || channel;
  }

  /**
   * Export payment history data
   */
  async exportPaymentHistory(format: string, filters: any, adminId: string) {
    try {
      // Get all transactions matching filters
      const query: any = {};
      
      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.startDate || filters.endDate) {
        query.date = {};
        if (filters.startDate) {
          query.date.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.date.$lte = new Date(filters.endDate);
        }
      }

      const transactions = await this.transactionModel.find(query).lean();

      // Format data for export
      const exportData = transactions.map(transaction => ({
        id: transaction._id,
        userId: transaction.userId,
        type: transaction.type,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        description: transaction.description,
        date: transaction.date,
        channel: transaction.channel,
        recipient: transaction.recipient,
        sender: transaction.sender,
        externalReference: transaction.externalReference
      }));

      return {
        status: 'success',
        message: 'Payment history export generated successfully',
        data: exportData
      };
    } catch (error) {
      console.error('Error exporting payment history:', error);
      throw new BadRequestException('Failed to export payment history');
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStatistics(filters: any, adminId: string) {
    try {
      // Build query for statistics
      const query: any = {};
      
      if (filters.startDate || filters.endDate) {
        query.date = {};
        if (filters.startDate) {
          query.date.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.date.$lte = new Date(filters.endDate);
        }
      }

      // Get total payments
      const totalPayments = await this.transactionModel.countDocuments(query);

      // Get successful payments
      const successfulPayments = await this.transactionModel.countDocuments({
        ...query,
        status: 'successful'
      });

      // Get total revenue
      const revenueResult = await this.transactionModel.aggregate([
        {
          $match: {
            ...query,
            status: 'successful'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const totalRevenue = revenueResult[0]?.total || 0;

      // Get average transaction amount
      const avgResult = await this.transactionModel.aggregate([
        {
          $match: {
            ...query,
            status: 'successful'
          }
        },
        {
          $group: {
            _id: null,
            average: { $avg: '$amount' }
          }
        }
      ]);

      const averageAmount = avgResult[0]?.average || 0;

      return {
        status: 'success',
        message: 'Payment statistics retrieved successfully',
        data: {
          totalPayments,
          successfulPayments,
          failedPayments: totalPayments - successfulPayments,
          totalRevenue,
          averageAmount,
          successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0
        }
      };
    } catch (error) {
      console.error('Error getting payment statistics:', error);
      throw new BadRequestException('Failed to get payment statistics');
    }
  }

  /**
   * Get status badge configuration
   */
  private getStatusBadge(status: string) {
    const statusConfig: { [key: string]: { text: string; color: string } } = {
      successful: { text: 'Successful', color: 'green' },
      pending: { text: 'Pending', color: 'yellow' },
      failed: { text: 'Failed', color: 'red' },
      cancelled: { text: 'Cancelled', color: 'gray' }
    };

    return statusConfig[status] || { text: 'Unknown', color: 'gray' };
  }
}