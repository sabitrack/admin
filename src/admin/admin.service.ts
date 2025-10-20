import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin, AdminDocument, AdminRole } from './admin.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
  ) {}

  async createAdmin(adminData: {
    email: string;
    password: string;
    fullName: string;
    role?: AdminRole;
    createdBy?: string;
  }): Promise<AdminDocument> {
    const { email, password, fullName, role = AdminRole.ADMIN, createdBy } = adminData;
    
    // Check if admin already exists
    const existingAdmin = await this.adminModel.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      throw new BadRequestException('Admin with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const admin = new this.adminModel({
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName,
      role,
      createdBy,
      isActive: true,
    });

    return await admin.save();
  }

  async findByEmail(email: string): Promise<AdminDocument | null> {
    return await this.adminModel.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });
  }

  async findById(id: string): Promise<AdminDocument | null> {
    return await this.adminModel.findById(id);
  }

  async validatePassword(admin: AdminDocument, password: string): Promise<boolean> {
    return await bcrypt.compare(password, admin.password);
  }

  async updateLastLogin(adminId: string, ipAddress: string): Promise<void> {
    await this.adminModel.findByIdAndUpdate(adminId, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
      $push: { 
        loginHistory: {
          $each: [`${new Date().toISOString()} - ${ipAddress}`],
          $slice: -10 // Keep only last 10 logins
        }
      }
    });
  }

  async logActivity(adminId: string, action: string, details: string, ipAddress: string): Promise<void> {
    await this.adminModel.findByIdAndUpdate(adminId, {
      $push: {
        activityLogs: {
          action,
          details,
          timestamp: new Date(),
          ipAddress
        }
      }
    });
  }

  async getAllAdmins(): Promise<AdminDocument[]> {
    return await this.adminModel.find({ isActive: true })
      .select('-password -activityLogs -loginHistory')
      .sort({ createdAt: -1 });
  }

  async updateAdminRole(adminId: string, newRole: AdminRole, updatedBy: string): Promise<AdminDocument> {
    const admin = await this.adminModel.findByIdAndUpdate(
      adminId,
      { 
        role: newRole,
        updatedBy 
      },
      { new: true }
    ).select('-password -activityLogs -loginHistory');

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  async deactivateAdmin(adminId: string, deactivatedBy: string): Promise<void> {
    const admin = await this.adminModel.findByIdAndUpdate(
      adminId,
      { 
        isActive: false,
        updatedBy: deactivatedBy 
      }
    );

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
  }

  async changePassword(adminId: string, newPassword: string): Promise<void> {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await this.adminModel.findByIdAndUpdate(adminId, {
      password: hashedPassword
    });
  }
}






