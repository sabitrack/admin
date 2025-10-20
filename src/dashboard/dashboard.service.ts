import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/user.schema';
import { Transaction, TransactionDocument } from '../payment-history/transaction.schema';
import { Project, ProjectDocument } from './project.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async getDashboardData(adminId: string, filters?: { startDate?: string; endDate?: string }) {
    try {
      // Set date range - default to last 30 days if not provided
      const endDate = filters?.endDate ? new Date(filters.endDate) : new Date();
      const startDate = filters?.startDate ? new Date(filters.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Debug: Check what data we have
      const totalUsers = await this.userModel.countDocuments();
      const totalTransactions = await this.transactionModel.countDocuments();
      const totalProjects = await this.projectModel.countDocuments();
      const sampleTransaction = await this.transactionModel.findOne().lean();
      const sampleProject = await this.projectModel.findOne().lean();
      
      console.log('Dashboard Debug:', {
        totalUsers,
        totalTransactions,
        totalProjects,
        sampleTransaction,
        sampleProject,
        dateRange: { startDate, endDate }
      });

      // Get key metrics
      const keyMetrics = await this.getKeyMetrics(startDate, endDate);
      
      // Get user activity overview (last 12 months)
      const userActivity = await this.getUserActivityOverview();

      return {
        status: 'success',
        message: 'Dashboard data retrieved successfully',
        data: {
          keyMetrics,
          userActivity
        }
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw new Error('Failed to get dashboard data');
    }
  }

  private async getKeyMetrics(startDate: Date, endDate: Date) {
    // Total Revenue - sum of all successful transactions (any type)
    const totalRevenue = await this.transactionModel.aggregate([
      {
        $match: {
          status: 'successful',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Total Project Sponsored - count of projects created in the period
    const totalProjectSponsored = await this.projectModel.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Total Project Sponsors - count of users with userType = 'sponsor'
    const totalProjectSponsors = await this.userModel.countDocuments({
      userType: 'sponsor',
      createdAt: { $lte: endDate }
    });

    // Total Vendors - count of users with userType = 'vendor'
    const totalVendors = await this.userModel.countDocuments({
      userType: 'vendor',
      createdAt: { $lte: endDate }
    });

    // Total Transactions - count of all transactions
    const totalTransactions = await this.transactionModel.countDocuments({
      date: { $gte: startDate, $lte: endDate }
    });

    // Active Project Sponsors - sponsors who have been active in the last month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const activeProjectSponsors = await this.userModel.countDocuments({
      userType: 'sponsor',
      updatedAt: { $gte: oneMonthAgo }
    });

    // Active Vendors - vendors who have been active in the last month
    const activeVendors = await this.userModel.countDocuments({
      userType: 'vendor',
      updatedAt: { $gte: oneMonthAgo }
    });

    // Calculate previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = new Date(startDate.getTime());

    console.log('Key Metrics Debug:', {
      totalRevenue: totalRevenue,
      totalProjectSponsored: totalProjectSponsored,
      totalProjectSponsors: totalProjectSponsors,
      totalVendors: totalVendors,
      totalTransactions: totalTransactions,
      activeProjectSponsors: activeProjectSponsors,
      activeVendors: activeVendors,
      dateRange: { startDate, endDate },
      prevDateRange: { prevStartDate, prevEndDate }
    });

    const prevTotalRevenue = await this.transactionModel.aggregate([
      {
        $match: {
          status: 'successful',
          date: { $gte: prevStartDate, $lte: prevEndDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const prevTotalProjectSponsored = await this.projectModel.countDocuments({
      createdAt: { $gte: prevStartDate, $lte: prevEndDate }
    });

    const prevTotalProjectSponsors = await this.userModel.countDocuments({
      userType: 'sponsor',
      createdAt: { $lte: prevEndDate }
    });

    const prevTotalVendors = await this.userModel.countDocuments({
      userType: 'vendor',
      createdAt: { $lte: prevEndDate }
    });

    const prevTotalTransactions = await this.transactionModel.countDocuments({
      date: { $gte: prevStartDate, $lte: prevEndDate }
    });

    const prevOneMonthAgo = new Date(prevEndDate);
    prevOneMonthAgo.setMonth(prevOneMonthAgo.getMonth() - 1);

    const prevActiveProjectSponsors = await this.userModel.countDocuments({
      userType: 'sponsor',
      updatedAt: { $gte: prevOneMonthAgo }
    });

    const prevActiveVendors = await this.userModel.countDocuments({
      userType: 'vendor',
      updatedAt: { $gte: prevOneMonthAgo }
    });

    // Calculate percentage changes
    const calculatePercentageChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const revenueAmount = totalRevenue[0]?.total || 0;
    const prevRevenueAmount = prevTotalRevenue[0]?.total || 0;
    const revenueChange = calculatePercentageChange(revenueAmount, prevRevenueAmount);

    const projectSponsoredCount = totalProjectSponsored || 0;
    const prevProjectSponsoredCount = prevTotalProjectSponsored || 0;
    const projectSponsoredChange = calculatePercentageChange(projectSponsoredCount, prevProjectSponsoredCount);

    const projectSponsorCount = totalProjectSponsors || 0;
    const prevProjectSponsorCount = prevTotalProjectSponsors || 0;
    const projectSponsorChange = calculatePercentageChange(projectSponsorCount, prevProjectSponsorCount);

    const vendorCount = totalVendors || 0;
    const prevVendorCount = prevTotalVendors || 0;
    const vendorChange = calculatePercentageChange(vendorCount, prevVendorCount);

    const transactionCount = totalTransactions || 0;
    const prevTransactionCount = prevTotalTransactions || 0;
    const transactionChange = calculatePercentageChange(transactionCount, prevTransactionCount);

    const activeSponsorCount = activeProjectSponsors || 0;
    const prevActiveSponsorCount = prevActiveProjectSponsors || 0;
    const activeSponsorChange = calculatePercentageChange(activeSponsorCount, prevActiveSponsorCount);

    const activeVendorCount = activeVendors || 0;
    const prevActiveVendorCount = prevActiveVendors || 0;
    const activeVendorChange = calculatePercentageChange(activeVendorCount, prevActiveVendorCount);

    return {
      totalRevenue: {
        value: revenueAmount,
        formatted: this.formatCurrency(revenueAmount),
        change: revenueChange,
        changeText: `${revenueChange >= 0 ? '↑' : '↓'}${Math.abs(revenueChange).toFixed(2)}% vs last period`
      },
      totalProjectSponsored: {
        value: projectSponsoredCount,
        formatted: projectSponsoredCount.toLocaleString(),
        change: projectSponsoredChange,
        changeText: `${projectSponsoredChange >= 0 ? '↑' : '↓'}${Math.abs(projectSponsoredChange).toFixed(2)}% vs last period`
      },
      totalProjectSponsors: {
        value: projectSponsorCount,
        formatted: projectSponsorCount.toLocaleString(),
        change: projectSponsorChange,
        changeText: `${projectSponsorChange >= 0 ? '↑' : '↓'}${Math.abs(projectSponsorChange).toFixed(2)}% vs last period`
      },
      totalVendors: {
        value: vendorCount,
        formatted: vendorCount.toLocaleString(),
        change: vendorChange,
        changeText: `${vendorChange >= 0 ? '↑' : '↓'}${Math.abs(vendorChange).toFixed(2)}% vs last period`
      },
      totalTransactions: {
        value: transactionCount,
        formatted: transactionCount.toLocaleString(),
        change: transactionChange,
        changeText: `${transactionChange >= 0 ? '↑' : '↓'}${Math.abs(transactionChange).toFixed(2)}% vs last period`
      },
      activeProjectSponsors: {
        value: activeSponsorCount,
        formatted: activeSponsorCount.toLocaleString(),
        change: activeSponsorChange,
        changeText: `${activeSponsorChange >= 0 ? '↑' : '↓'}${Math.abs(activeSponsorChange).toFixed(2)}% vs last period`
      },
      activeVendors: {
        value: activeVendorCount,
        formatted: activeVendorCount.toLocaleString(),
        change: activeVendorChange,
        changeText: `${activeVendorChange >= 0 ? '↑' : '↓'}${Math.abs(activeVendorChange).toFixed(2)}% vs last period`
      }
    };
  }

  private async getUserActivityOverview() {
    // Get data for last 12 months
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);

    // Get monthly project sponsor registrations (users created with userType: 'sponsor')
    const projectSponsorActivity = await this.userModel.aggregate([
      {
        $match: {
          userType: 'sponsor',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          year: '$_id.year',
          count: 1
        }
      },
      {
        $sort: { year: 1, month: 1 }
      }
    ]);

    // Get monthly vendor registrations (users created with userType: 'vendor')
    const vendorActivity = await this.userModel.aggregate([
      {
        $match: {
          userType: 'vendor',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          year: '$_id.year',
          count: 1
        }
      },
      {
        $sort: { year: 1, month: 1 }
      }
    ]);

    console.log('User Activity Debug:', {
      projectSponsorActivity,
      vendorActivity,
      dateRange: { startDate, endDate }
    });

    // Create a complete 12-month dataset
    const months = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      const sponsorData = projectSponsorActivity.find(d => d.month === month && d.year === year);
      const vendorData = vendorActivity.find(d => d.month === month && d.year === year);
      
      months.push({
        month: this.getMonthName(month),
        year: year,
        projectSponsors: sponsorData?.count || 0,
        vendors: vendorData?.count || 0
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return {
      months: months.slice(0, 12) // Ensure we only return 12 months
    };
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  private getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  }
}
