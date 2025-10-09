import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { AdminService } from '../admin/admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { UpdateVerificationStatusDto } from './dto/update-verification-status.dto';
import { GrantAdminDto } from './dto/grant-admin.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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
}
