import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminRole } from '../admin/admin.schema';

@ApiBearerAuth('admin-auth')
@ApiTags('wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('user/:userId/information')
  @ApiOperation({ summary: 'Get comprehensive wallet information for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Wallet information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Wallet information retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            walletBalance: {
              type: 'object',
              properties: {
                amount: { type: 'number', example: 10983100 },
                currency: { type: 'string', example: 'NGN' },
                formatted: { type: 'string', example: 'NGN 10,983,100.00' }
              }
            },
            localPaymentMethods: {
              type: 'object',
              properties: {
                bankAccounts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      bankName: { type: 'string', example: 'United Bank For Africa' },
                      accountNumber: { type: 'string', example: '2373900023' },
                      accountName: { type: 'string', example: 'Oluwafemi Samson Adeosun' },
                      bankCode: { type: 'string' },
                      isAutoFundingOption: { type: 'boolean' }
                    }
                  }
                },
                debitCards: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      bankName: { type: 'string', example: 'Zenith Bank' },
                      cardNumber: { type: 'string', example: '2373900023123456' },
                      expiryDate: { type: 'string', example: '01/26' },
                      cvv: { type: 'string', example: '231' },
                      isAutoFundingOption: { type: 'boolean' }
                    }
                  }
                }
              }
            },
            internationalPaymentMethods: {
              type: 'object',
              properties: {
                virtualCards: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      providerName: { type: 'string', example: 'Stripe' },
                      cardNumber: { type: 'string', example: '2373900023123456' },
                      expiryDate: { type: 'string', example: '01/26' },
                      cvv: { type: 'string', example: '231' }
                    }
                  }
                },
                paypalConnections: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      accountName: { type: 'string', example: 'SabiTrack-Oluwafemi' },
                      bankName: { type: 'string', example: 'SabiTrack/Paypal' },
                      accountNumber: { type: 'string', example: '2397737000' }
                    }
                  }
                }
              }
            },
            autoFundingOptions: {
              type: 'object',
              properties: {
                selectedMethod: { type: 'string', example: 'bank_account_id' },
                availableMethods: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      type: { type: 'string', example: 'bank_account' },
                      name: { type: 'string', example: 'United Bank For Africa' },
                      details: { type: 'string', example: '2373900023' },
                      isSelected: { type: 'boolean' }
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
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getWalletInformation(@Param('userId') userId: string, @Request() req) {
    return this.walletService.getWalletInformation(userId, req.user.adminId);
  }

  @Get('user/:userId/balance')
  @ApiOperation({ summary: 'Get user wallet balance' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Wallet balance retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserBalance(@Param('userId') userId: string, @Request() req) {
    return this.walletService.getUserBalance(userId, req.user.adminId);
  }

  @Get('user/:userId/payment-methods')
  @ApiOperation({ summary: 'Get user payment methods' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Payment methods retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserPaymentMethods(@Param('userId') userId: string, @Request() req) {
    return this.walletService.getUserPaymentMethods(userId, req.user.adminId);
  }
}
