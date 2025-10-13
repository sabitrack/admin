import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/user.schema';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Get comprehensive wallet information for a user
   */
  async getWalletInformation(userId: string, adminId: string) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Get wallet balance
      const balance = user.balance || 0;
      const currency = user.preferredCurrency || 'NGN';
      
      // Format balance for display
      const formattedBalance = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(balance);

      // Get local payment methods
      const localPaymentMethods = {
        bankAccounts: user.bankAccounts || [],
        debitCards: user.debitCards || []
      };

      // Get international payment methods
      const internationalPaymentMethods = {
        virtualCards: user.internationalPaymentOptions?.filter(option => 
          option.includes('virtual_card') || option.includes('stripe')
        ).map(option => ({
          id: `virtual_${Date.now()}`,
          providerName: 'Stripe',
          cardNumber: '2373900023123456',
          expiryDate: '01/26',
          cvv: '231'
        })) || [],
        paypalConnections: user.internationalPaymentOptions?.filter(option => 
          option.includes('paypal')
        ).map(option => ({
          id: `paypal_${Date.now()}`,
          accountName: `SabiTrack-${user.fullName || user.email}`,
          bankName: 'SabiTrack/Paypal',
          accountNumber: '2397737000'
        })) || []
      };

      // Get auto-funding options
      const autoFundingMethod = user.autoFundingMethod;
      const allPaymentMethods = [
        ...(user.bankAccounts || []).map(account => ({
          id: account._id || `bank_${Date.now()}`,
          type: 'bank_account',
          name: account.bankName,
          details: account.accountNumber,
          isSelected: autoFundingMethod === account._id
        })),
        ...(user.debitCards || []).map(card => ({
          id: card._id || `card_${Date.now()}`,
          type: 'debit_card',
          name: card.bankName,
          details: card.accountNumber,
          isSelected: autoFundingMethod === card._id
        }))
      ];

      return {
        status: 'success',
        message: 'Wallet information retrieved successfully',
        data: {
          walletBalance: {
            amount: balance,
            currency: currency,
            formatted: formattedBalance
          },
          localPaymentMethods: {
            bankAccounts: (user.bankAccounts || []).map(account => ({
              id: account._id || `bank_${Date.now()}`,
              bankName: account.bankName,
              accountNumber: account.accountNumber,
              accountName: account.accountName,
              bankCode: account.bankCode,
              isAutoFundingOption: autoFundingMethod === account._id
            })),
            debitCards: (user.debitCards || []).map(card => ({
              id: card._id || `card_${Date.now()}`,
              bankName: card.bankName,
              cardNumber: card.accountNumber,
              expiryDate: '01/26', // This would come from actual card data
              cvv: '231', // This would come from actual card data
              isAutoFundingOption: autoFundingMethod === card._id
            }))
          },
          internationalPaymentMethods: {
            virtualCards: internationalPaymentMethods.virtualCards,
            paypalConnections: internationalPaymentMethods.paypalConnections
          },
          autoFundingOptions: {
            selectedMethod: autoFundingMethod,
            availableMethods: allPaymentMethods
          }
        }
      };
    } catch (error) {
      console.error('Error getting wallet information:', error);
      throw new BadRequestException('Failed to get wallet information');
    }
  }

  /**
   * Get user wallet balance
   */
  async getUserBalance(userId: string, adminId: string) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const balance = user.balance || 0;
      const currency = user.preferredCurrency || 'NGN';
      
      const formattedBalance = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(balance);

      return {
        status: 'success',
        message: 'Wallet balance retrieved successfully',
        data: {
          userId: userId,
          balance: {
            amount: balance,
            currency: currency,
            formatted: formattedBalance
          },
          projectBalance: user.projectBalance || 0,
          lastUpdated: new Date()
        }
      };
    } catch (error) {
      console.error('Error getting user balance:', error);
      throw new BadRequestException('Failed to get user balance');
    }
  }

  /**
   * Get user payment methods
   */
  async getUserPaymentMethods(userId: string, adminId: string) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      return {
        status: 'success',
        message: 'Payment methods retrieved successfully',
        data: {
          userId: userId,
          localPaymentMethods: {
            bankAccounts: user.bankAccounts || [],
            debitCards: user.debitCards || []
          },
          internationalPaymentMethods: {
            options: user.internationalPaymentOptions || [],
            localOptions: user.localPaymentOptions || []
          },
          autoFundingMethod: user.autoFundingMethod,
          preferredCurrency: user.preferredCurrency || 'NGN'
        }
      };
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw new BadRequestException('Failed to get payment methods');
    }
  }
}
