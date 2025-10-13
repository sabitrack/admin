import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/user.schema';

// Mock transaction schema for payment history
interface PaymentTransaction {
  _id: string;
  invoiceId: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  recipientAvatar?: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  status: 'successful' | 'pending' | 'failed' | 'cancelled';
  description?: string;
  reference?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PaymentHistoryService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Get payment history with pagination and filters
   */
  async getPaymentHistory(page: number, limit: number, filters: any, adminId: string) {
    try {
      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Mock payment data - in real implementation, this would come from a transactions collection
      const mockPayments: PaymentTransaction[] = [
        {
          _id: '1',
          invoiceId: 'INV001234',
          recipientId: 'user1',
          recipientName: 'Rayo Sabitrack',
          recipientEmail: 'rayo@sabitrack.com',
          recipientAvatar: 'https://example.com/avatar1.jpg',
          paymentMethod: 'Bank Account',
          amount: 10000,
          currency: 'NGN',
          paymentDate: new Date('2024-12-14T04:39:53.000Z'),
          status: 'successful',
          description: 'Project milestone payment',
          reference: 'REF001',
          createdAt: new Date('2024-12-14T04:39:53.000Z'),
          updatedAt: new Date('2024-12-14T04:39:53.000Z')
        },
        {
          _id: '2',
          invoiceId: 'INV001234',
          recipientId: 'user2',
          recipientName: 'Mary Obajuwon',
          recipientEmail: 'mary@sabitrack.com',
          recipientAvatar: 'https://example.com/avatar2.jpg',
          paymentMethod: 'Debit Card',
          amount: 10000,
          currency: 'NGN',
          paymentDate: new Date('2024-12-14T04:39:53.000Z'),
          status: 'pending',
          description: 'Project milestone payment',
          reference: 'REF002',
          createdAt: new Date('2024-12-14T04:39:53.000Z'),
          updatedAt: new Date('2024-12-14T04:39:53.000Z')
        },
        {
          _id: '3',
          invoiceId: 'INV001234',
          recipientId: 'user3',
          recipientName: 'Agnes Gilbert',
          recipientEmail: 'agnes@sabitrack.com',
          recipientAvatar: 'https://example.com/avatar3.jpg',
          paymentMethod: 'Bank Account',
          amount: 10000,
          currency: 'NGN',
          paymentDate: new Date('2024-12-14T04:39:53.000Z'),
          status: 'successful',
          description: 'Project milestone payment',
          reference: 'REF003',
          createdAt: new Date('2024-12-14T04:39:53.000Z'),
          updatedAt: new Date('2024-12-14T04:39:53.000Z')
        }
      ];

      // Apply filters
      let filteredPayments = mockPayments;

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredPayments = filteredPayments.filter(payment => 
          payment.invoiceId.toLowerCase().includes(searchTerm) ||
          payment.recipientName.toLowerCase().includes(searchTerm) ||
          payment.recipientEmail.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.status) {
        filteredPayments = filteredPayments.filter(payment => 
          payment.status === filters.status
        );
      }

      if (filters.paymentMethod) {
        filteredPayments = filteredPayments.filter(payment => 
          payment.paymentMethod.toLowerCase().includes(filters.paymentMethod.toLowerCase())
        );
      }

      if (filters.startDate || filters.endDate) {
        const startDate = filters.startDate ? new Date(filters.startDate) : null;
        const endDate = filters.endDate ? new Date(filters.endDate) : null;
        
        filteredPayments = filteredPayments.filter(payment => {
          const paymentDate = new Date(payment.paymentDate);
          if (startDate && paymentDate < startDate) return false;
          if (endDate && paymentDate > endDate) return false;
          return true;
        });
      }

      // Apply sorting
      if (filters.sortBy) {
        filteredPayments.sort((a, b) => {
          let aValue, bValue;
          
          switch (filters.sortBy) {
            case 'date':
              aValue = new Date(a.paymentDate).getTime();
              bValue = new Date(b.paymentDate).getTime();
              break;
            case 'amount':
              aValue = a.amount;
              bValue = b.amount;
              break;
            case 'status':
              aValue = a.status;
              bValue = b.status;
              break;
            default:
              aValue = new Date(a.paymentDate).getTime();
              bValue = new Date(b.paymentDate).getTime();
          }
          
          if (filters.sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      }

      // Get total count
      const totalItems = filteredPayments.length;
      const totalPages = Math.ceil(totalItems / limit);

      // Apply pagination
      const paginatedPayments = filteredPayments.slice(skip, skip + limit);

      // Format payments for response
      const formattedPayments = paginatedPayments.map(payment => ({
        id: payment._id,
        invoiceId: `#${payment.invoiceId}`,
        recipient: {
          id: payment.recipientId,
          name: payment.recipientName,
          avatar: payment.recipientAvatar,
          email: payment.recipientEmail
        },
        paymentMethod: payment.paymentMethod,
        amount: {
          value: payment.amount,
          currency: payment.currency,
          formatted: new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: payment.currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(payment.amount)
        },
        paymentDate: payment.paymentDate.toISOString(),
        status: payment.status,
        statusBadge: this.getStatusBadge(payment.status),
        actions: {
          canView: true,
          canDelete: payment.status !== 'successful',
          canEdit: payment.status === 'pending'
        }
      }));

      return {
        status: 'success',
        message: 'Payment history retrieved successfully',
        data: {
          payments: formattedPayments,
          pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalItems: totalItems,
            itemsPerPage: limit,
            hasNext: page < totalPages,
            hasPrev: page > 1
          },
          filters: {
            applied: filters,
            available: {
              statuses: ['successful', 'pending', 'failed', 'cancelled'],
              paymentMethods: ['Bank Account', 'Debit Card', 'Credit Card', 'PayPal']
            }
          }
        }
      };
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw new BadRequestException('Failed to get payment history');
    }
  }

  /**
   * Export payment history data
   */
  async exportPaymentHistory(format: string, filters: any, adminId: string) {
    try {
      // In a real implementation, this would generate actual export files
      const exportData = {
        format: format,
        filters: filters,
        generatedAt: new Date().toISOString(),
        downloadUrl: `https://admin-api.sabitrack.com/exports/payment-history-${Date.now()}.${format}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };

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
      // Mock statistics - in real implementation, this would be calculated from actual data
      const statistics = {
        totalPayments: 200,
        successfulPayments: 150,
        pendingPayments: 30,
        failedPayments: 15,
        cancelledPayments: 5,
        totalAmount: {
          value: 2000000,
          currency: 'NGN',
          formatted: '₦2,000,000.00'
        },
        averageAmount: {
          value: 10000,
          currency: 'NGN',
          formatted: '₦10,000.00'
        },
        paymentMethods: {
          'Bank Account': 120,
          'Debit Card': 50,
          'Credit Card': 20,
          'PayPal': 10
        },
        statusDistribution: {
          successful: 75,
          pending: 15,
          failed: 7.5,
          cancelled: 2.5
        }
      };

      return {
        status: 'success',
        message: 'Payment statistics retrieved successfully',
        data: statistics
      };
    } catch (error) {
      console.error('Error getting payment statistics:', error);
      throw new BadRequestException('Failed to get payment statistics');
    }
  }

  /**
   * Get status badge information
   */
  private getStatusBadge(status: string) {
    const statusConfig = {
      successful: { text: 'Successful', color: 'green' },
      pending: { text: 'Pending', color: 'orange' },
      failed: { text: 'Failed', color: 'red' },
      cancelled: { text: 'Cancelled', color: 'gray' }
    };

    return statusConfig[status] || { text: 'Unknown', color: 'gray' };
  }
}
