import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './audit.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async logAction(logData: {
    adminId: string;
    adminEmail: string;
    action: string;
    targetUserId?: string;
    targetUserEmail?: string;
    details: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): Promise<AuditLogDocument> {
    const auditLog = new this.auditLogModel({
      ...logData,
      timestamp: new Date(),
    });

    return await auditLog.save();
  }

  async getAuditLogs(
    page: number = 1,
    limit: number = 50,
    filters: {
      adminId?: string;
      action?: string;
      targetUserId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (filters.adminId) {
      query.adminId = filters.adminId;
    }

    if (filters.action) {
      query.action = filters.action;
    }

    if (filters.targetUserId) {
      query.targetUserId = filters.targetUserId;
    }

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        query.timestamp.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.timestamp.$lte = filters.endDate;
      }
    }

    const auditLogs = await this.auditLogModel
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.auditLogModel.countDocuments(query);

    return {
      auditLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getAdminActivityLogs(adminId: string, page: number = 1, limit: number = 50) {
    return await this.getAuditLogs(page, limit, { adminId });
  }

  async getUserActivityLogs(targetUserId: string, page: number = 1, limit: number = 50) {
    return await this.getAuditLogs(page, limit, { targetUserId });
  }

  async getAuditStats() {
    const totalLogs = await this.auditLogModel.countDocuments();
    
    const actionStats = await this.auditLogModel.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const adminStats = await this.auditLogModel.aggregate([
      {
        $group: {
          _id: '$adminEmail',
          count: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    return {
      totalLogs,
      actionStats,
      adminStats,
    };
  }
}
