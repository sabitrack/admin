import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { AdminService } from '../admin/admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { UpdateVerificationStatusDto } from './dto/update-verification-status.dto';
import { GrantAdminDto } from './dto/grant-admin.dto';
import { Project, ProjectDocument } from '../dashboard/project.schema';
import { Transaction, TransactionDocument } from '../payment-history/transaction.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private adminService: AdminService,
  ) {}

  async getAllUsers(page: number = 1, limit: number = 10, filters: any = {}) {
    const skip = (page - 1) * limit;
    const query: any = { deleted: { $ne: true } };

    // Apply filters
    if (filters.search) {
      query.$or = [
        { email: { $regex: filters.search, $options: 'i' } },
        { fullName: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.userType) {
      query.userType = filters.userType;
    }

    if (filters.verificationStatus) {
      query.verificationStatus = filters.verificationStatus;
    }

    if (filters.isBanned !== undefined) {
      query.isBanned = filters.isBanned;
    }

    const users = await this.userModel
      .find(query)
      .select('-password -transactionPin')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.userModel.countDocuments(query);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).select('-password -transactionPin');
    if (!user || user.deleted) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async createUser(createUserDto: CreateUserDto, adminId: string): Promise<UserDocument> {
    const { email, userType, fullName } = createUserDto;
    
    const existingUser = await this.userModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const user = new this.userModel({
      email: email.toLowerCase(),
      userType,
      fullName,
      isVerified: false,
      verificationStatus: 'pending',
    });

    const savedUser = await user.save();

    // Log admin activity
    await this.adminService.logActivity(
      adminId,
      'CREATE_USER',
      `Created user: ${email}`,
      'admin-api'
    );

    return savedUser;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto, adminId: string): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { ...updateUserDto, updatedAt: new Date() },
      { new: true }
    ).select('-password -transactionPin');

    if (!user || user.deleted) {
      throw new NotFoundException('User not found');
    }

    // Log admin activity
    await this.adminService.logActivity(
      adminId,
      'UPDATE_USER',
      `Updated user: ${user.email}`,
      'admin-api'
    );

    return user;
  }

  async deleteUser(id: string, adminId: string): Promise<void> {
    const user = await this.userModel.findById(id);
    if (!user || user.deleted) {
      throw new NotFoundException('User not found');
    }

    await this.userModel.findByIdAndUpdate(id, {
      deleted: true,
      deleteReason: 'Deleted by admin',
      deleteRequestedAt: new Date(),
    });

    // Log admin activity
    await this.adminService.logActivity(
      adminId,
      'DELETE_USER',
      `Soft deleted user: ${user.email}`,
      'admin-api'
    );
  }

  async bulkDeleteUsers(userIds: string[], adminId: string): Promise<{
    success: number;
    failed: number;
    results: Array<{ userId: string; success: boolean; message: string }>;
  }> {
    if (!userIds || userIds.length === 0) {
      throw new BadRequestException('User IDs array cannot be empty');
    }

    const results: Array<{ userId: string; success: boolean; message: string }> = [];
    let successCount = 0;
    let failedCount = 0;
    const deletedEmails: string[] = [];

    // Process each user ID
    for (const userId of userIds) {
      try {
        const user = await this.userModel.findById(userId);
        
        if (!user) {
          results.push({
            userId,
            success: false,
            message: 'User not found',
          });
          failedCount++;
          continue;
        }

        if (user.deleted) {
          results.push({
            userId,
            success: false,
            message: 'User already deleted',
          });
          failedCount++;
          continue;
        }

        // Soft delete the user
        await this.userModel.findByIdAndUpdate(userId, {
          deleted: true,
          deleteReason: 'Deleted by admin (bulk delete)',
          deleteRequestedAt: new Date(),
        });

        deletedEmails.push(user.email);
        results.push({
          userId,
          success: true,
          message: 'User deleted successfully',
        });
        successCount++;
      } catch (error) {
        results.push({
          userId,
          success: false,
          message: error.message || 'Failed to delete user',
        });
        failedCount++;
      }
    }

    // Log admin activity for bulk delete
    await this.adminService.logActivity(
      adminId,
      'BULK_DELETE_USERS',
      `Bulk deleted ${successCount} user(s): ${deletedEmails.join(', ')}`,
      'admin-api'
    );

    return {
      success: successCount,
      failed: failedCount,
      results,
    };
  }

  async banUser(id: string, banUserDto: BanUserDto, adminId: string): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      {
        isBanned: true,
        banReason: banUserDto.reason,
        bannedBy: adminId,
        bannedAt: new Date(),
      },
      { new: true }
    ).select('-password -transactionPin');

    if (!user || user.deleted) {
      throw new NotFoundException('User not found');
    }

    // Log admin activity
    await this.adminService.logActivity(
      adminId,
      'BAN_USER',
      `Banned user: ${user.email}. Reason: ${banUserDto.reason}`,
      'admin-api'
    );

    return user;
  }

  async unbanUser(id: string, adminId: string): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      {
        isBanned: false,
        unbanReason: 'Unbanned by admin',
        unbannedBy: adminId,
        unbannedAt: new Date(),
      },
      { new: true }
    ).select('-password -transactionPin');

    if (!user || user.deleted) {
      throw new NotFoundException('User not found');
    }

    // Log admin activity
    await this.adminService.logActivity(
      adminId,
      'UNBAN_USER',
      `Unbanned user: ${user.email}`,
      'admin-api'
    );

    return user;
  }

  async updateVerificationStatus(
    id: string, 
    updateVerificationDto: UpdateVerificationStatusDto, 
    adminId: string
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user || user.deleted) {
      throw new NotFoundException('User not found');
    }

    const verificationEntry = {
      status: updateVerificationDto.status,
      reason: updateVerificationDto.reason,
      verifiedBy: adminId,
      verifiedAt: new Date(),
    };

    await this.userModel.findByIdAndUpdate(id, {
      verificationStatus: updateVerificationDto.status,
      $push: { verificationHistory: verificationEntry },
    });

    // Log admin activity
    await this.adminService.logActivity(
      adminId,
      'UPDATE_VERIFICATION',
      `Updated verification status for user: ${user.email} to ${updateVerificationDto.status}`,
      'admin-api'
    );

    return await this.getUserById(id);
  }

  async grantAdminRole(id: string, grantAdminDto: GrantAdminDto, adminId: string): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      {
        isAdmin: true,
        adminRole: grantAdminDto.role,
        $push: {
          adminHistory: {
            action: 'GRANT_ADMIN',
            reason: grantAdminDto.reason,
            grantedBy: adminId,
            grantedAt: new Date(),
          },
        },
      },
      { new: true }
    ).select('-password -transactionPin');

    if (!user || user.deleted) {
      throw new NotFoundException('User not found');
    }

    // Log admin activity
    await this.adminService.logActivity(
      adminId,
      'GRANT_ADMIN',
      `Granted admin role to user: ${user.email}`,
      'admin-api'
    );

    return user;
  }

  async revokeAdminRole(id: string, adminId: string): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      {
        isAdmin: false,
        adminRole: 'user',
        $push: {
          adminHistory: {
            action: 'REVOKE_ADMIN',
            reason: 'Admin role revoked',
            grantedBy: adminId,
            grantedAt: new Date(),
          },
        },
      },
      { new: true }
    ).select('-password -transactionPin');

    if (!user || user.deleted) {
      throw new NotFoundException('User not found');
    }

    // Log admin activity
    await this.adminService.logActivity(
      adminId,
      'REVOKE_ADMIN',
      `Revoked admin role from user: ${user.email}`,
      'admin-api'
    );

    return user;
  }

  async getUserActivityLogs(id: string) {
    const user = await this.userModel.findById(id).select('verificationHistory adminHistory');
    if (!user || user.deleted) {
      throw new NotFoundException('User not found');
    }

    return {
      verificationHistory: user.verificationHistory || [],
      adminHistory: user.adminHistory || [],
    };
  }

  /**
   * Get all projects associated with a user
   */
  async getUserProjects(userId: string, page: number = 1, limit: number = 10) {
    try {
      // Verify user exists
      const user = await this.userModel.findById(userId);
      if (!user || user.deleted) {
        throw new NotFoundException('User not found');
      }

      const skip = (page - 1) * limit;

      // Get projects where user is owner or vendor
      const projects = await this.projectModel
        .find({
          $or: [
            { owner: userId },
            { vendorIds: new Types.ObjectId(userId) }
          ]
        })
        .populate('owner', 'fullName email profilePicture')
        .populate('vendorIds', 'fullName email profilePicture userType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await this.projectModel.countDocuments({
        $or: [
          { owner: userId },
          { vendorIds: new Types.ObjectId(userId) }
        ]
      });

      return {
        status: 'success',
        message: 'User projects retrieved successfully',
        data: {
          projects,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      };
    } catch (error) {
      console.error('Error getting user projects:', error);
      throw new BadRequestException('Failed to get user projects');
    }
  }

  /**
   * Get comprehensive project details
   */
  async getProjectDetails(projectId: string) {
    try {
      // Get project with populated data
      const project = await this.projectModel
        .findById(projectId)
        .populate('owner', 'fullName email profilePicture userType phoneNumber')
        .populate('vendorIds', 'fullName email profilePicture userType phoneNumber')
        .lean();

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // Get all transactions related to this project
      const transactions = await this.transactionModel
        .find({
          $or: [
            { externalReference: projectId },
            { description: { $regex: projectId, $options: 'i' } }
          ]
        })
        .populate('userId', 'fullName email userType')
        .sort({ date: -1 })
        .lean();

      // Get milestone payments specifically
      const milestonePayments = await this.transactionModel
        .find({
          type: 'milestone_payment',
          $or: [
            { externalReference: projectId },
            { description: { $regex: projectId, $options: 'i' } }
          ]
        })
        .populate('userId', 'fullName email userType')
        .sort({ date: -1 })
        .lean();

      // Calculate project statistics
      const totalSpent = transactions
        .filter(t => t.status === 'successful')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalMilestonePayments = milestonePayments
        .filter(t => t.status === 'successful')
        .reduce((sum, t) => sum + t.amount, 0);

      const successfulTransactions = transactions.filter(t => t.status === 'successful').length;
      const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
      const failedTransactions = transactions.filter(t => t.status === 'failed').length;

      // Get collaborators (vendors + owner)
      const owner = project.owner as any;
      const collaborators = [
        {
          id: owner._id,
          name: owner.fullName || 'Unknown',
          email: owner.email,
          userType: owner.userType,
          profilePicture: owner.profilePicture,
          role: 'Owner'
        },
        ...project.vendorIds.map((vendor: any) => ({
          id: vendor._id,
          name: vendor.fullName || 'Unknown',
          email: vendor.email,
          userType: vendor.userType,
          profilePicture: vendor.profilePicture,
          role: 'Vendor'
        }))
      ];

      return {
        status: 'success',
        message: 'Project details retrieved successfully',
        data: {
          project: {
            ...project,
            collaborators
          },
          statistics: {
            totalSpent,
            totalMilestonePayments,
            totalTransactions: transactions.length,
            successfulTransactions,
            pendingTransactions,
            failedTransactions,
            totalVendors: project.vendorIds.length,
            totalMilestones: project.milestones.length
          },
          transactions: {
            all: transactions,
            milestonePayments
          }
        }
      };
    } catch (error) {
      console.error('Error getting project details:', error);
      throw new BadRequestException('Failed to get project details');
    }
  }
}






