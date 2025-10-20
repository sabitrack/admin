import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission, PermissionDocument } from './permission.schema';

@Injectable()
export class PermissionService implements OnModuleInit {
  constructor(
    @InjectModel(Permission.name) private permissionModel: Model<PermissionDocument>,
  ) {}

  async onModuleInit() {
    await this.seedPermissions();
  }

  /**
   * Auto-seed permissions on server startup
   */
  private async seedPermissions() {
    try {
      const existingPermissions = await this.permissionModel.countDocuments();
      
      if (existingPermissions > 0) {
        console.log('✅ Permissions already exist, skipping seed');
        return;
      }

      console.log('🌱 Seeding permissions...');

      const permissions = [
        // User Management
        { permissionName: 'users.view', permissionGroup: 'User Management', description: 'View user list and details', priority: 'medium' },
        { permissionName: 'users.create', permissionGroup: 'User Management', description: 'Create new user accounts', priority: 'high' },
        { permissionName: 'users.edit', permissionGroup: 'User Management', description: 'Edit user information', priority: 'medium' },
        { permissionName: 'users.delete', permissionGroup: 'User Management', description: 'Delete user accounts', priority: 'critical' },
        { permissionName: 'users.ban', permissionGroup: 'User Management', description: 'Ban user accounts', priority: 'high' },
        { permissionName: 'users.unban', permissionGroup: 'User Management', description: 'Unban user accounts', priority: 'high' },
        { permissionName: 'users.verify', permissionGroup: 'User Management', description: 'Verify user accounts', priority: 'medium' },
        { permissionName: 'users.grant_admin', permissionGroup: 'User Management', description: 'Grant admin privileges', priority: 'critical' },
        { permissionName: 'users.revoke_admin', permissionGroup: 'User Management', description: 'Revoke admin privileges', priority: 'critical' },

        // Project Management
        { permissionName: 'projects.view', permissionGroup: 'Project Management', description: 'View project list and details', priority: 'medium' },
        { permissionName: 'projects.create', permissionGroup: 'Project Management', description: 'Create new projects', priority: 'high' },
        { permissionName: 'projects.edit', permissionGroup: 'Project Management', description: 'Edit project information', priority: 'medium' },
        { permissionName: 'projects.delete', permissionGroup: 'Project Management', description: 'Delete projects', priority: 'critical' },
        { permissionName: 'projects.assign', permissionGroup: 'Project Management', description: 'Assign projects to users', priority: 'high' },
        { permissionName: 'projects.approve', permissionGroup: 'Project Management', description: 'Approve project submissions', priority: 'high' },
        { permissionName: 'projects.reject', permissionGroup: 'Project Management', description: 'Reject project submissions', priority: 'high' },

        // Payment Management
        { permissionName: 'payments.view', permissionGroup: 'Payment Management', description: 'View payment history and details', priority: 'medium' },
        { permissionName: 'payments.process', permissionGroup: 'Payment Management', description: 'Process payment transactions', priority: 'high' },
        { permissionName: 'payments.refund', permissionGroup: 'Payment Management', description: 'Process payment refunds', priority: 'critical' },
        { permissionName: 'payments.export', permissionGroup: 'Payment Management', description: 'Export payment data', priority: 'low' },

        // Dashboard & Analytics
        { permissionName: 'dashboard.view', permissionGroup: 'Dashboard & Analytics', description: 'Access dashboard and analytics', priority: 'medium' },
        { permissionName: 'analytics.view', permissionGroup: 'Dashboard & Analytics', description: 'View detailed analytics', priority: 'medium' },
        { permissionName: 'reports.generate', permissionGroup: 'Dashboard & Analytics', description: 'Generate system reports', priority: 'low' },

        // System Administration
        { permissionName: 'system.settings', permissionGroup: 'System Administration', description: 'Manage system settings', priority: 'critical' },
        { permissionName: 'system.logs', permissionGroup: 'System Administration', description: 'View system logs', priority: 'medium' },
        { permissionName: 'system.backup', permissionGroup: 'System Administration', description: 'Manage system backups', priority: 'high' },
        { permissionName: 'system.maintenance', permissionGroup: 'System Administration', description: 'Perform system maintenance', priority: 'critical' },

        // Role Management
        { permissionName: 'roles.view', permissionGroup: 'Role Management', description: 'View role list and details', priority: 'medium' },
        { permissionName: 'roles.create', permissionGroup: 'Role Management', description: 'Create new roles', priority: 'high' },
        { permissionName: 'roles.edit', permissionGroup: 'Role Management', description: 'Edit role information', priority: 'high' },
        { permissionName: 'roles.delete', permissionGroup: 'Role Management', description: 'Delete roles', priority: 'critical' },
        { permissionName: 'roles.assign', permissionGroup: 'Role Management', description: 'Assign roles to admins', priority: 'high' },

        // Admin Management
        { permissionName: 'admins.view', permissionGroup: 'Admin Management', description: 'View admin list and details', priority: 'medium' },
        { permissionName: 'admins.create', permissionGroup: 'Admin Management', description: 'Create new admin accounts', priority: 'critical' },
        { permissionName: 'admins.edit', permissionGroup: 'Admin Management', description: 'Edit admin information', priority: 'high' },
        { permissionName: 'admins.delete', permissionGroup: 'Admin Management', description: 'Delete admin accounts', priority: 'critical' },
        { permissionName: 'admins.roles', permissionGroup: 'Admin Management', description: 'Manage admin role assignments', priority: 'high' }
      ];

      await this.permissionModel.insertMany(permissions);
      console.log(`✅ Successfully seeded ${permissions.length} permissions`);
    } catch (error) {
      console.error('❌ Error seeding permissions:', error);
    }
  }

  /**
   * Get all permissions grouped by permission group
   */
  async getPermissionsByGroup() {
    try {
      const permissions = await this.permissionModel
        .find({ isActive: true })
        .sort({ permissionGroup: 1, permissionName: 1 })
        .lean();

      // Group permissions by permissionGroup
      const groupedPermissions = permissions.reduce((acc, permission) => {
        const group = permission.permissionGroup;
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push({
          _id: permission._id,
          permissionName: permission.permissionName,
          description: permission.description,
          priority: permission.priority
        });
        return acc;
      }, {});

      // Also add a flat list of all permission IDs for easy access
      const allPermissionIds = permissions.map(p => ({
        _id: p._id,
        permissionName: p.permissionName,
        permissionGroup: p.permissionGroup
      }));

      return {
        status: 'success',
        message: 'Permissions retrieved successfully',
        data: {
          grouped: groupedPermissions,
          allIds: allPermissionIds
        }
      };
    } catch (error) {
      console.error('Error getting permissions:', error);
      throw new Error('Failed to get permissions');
    }
  }

  /**
   * Get all permissions
   */
  async getAllPermissions() {
    try {
      const permissions = await this.permissionModel
        .find({ isActive: true })
        .sort({ permissionGroup: 1, permissionName: 1 })
        .lean();

      return {
        status: 'success',
        message: 'Permissions retrieved successfully',
        data: permissions
      };
    } catch (error) {
      console.error('Error getting permissions:', error);
      throw new Error('Failed to get permissions');
    }
  }

  /**
   * Get permissions by group name
   */
  async getPermissionsByGroupName(groupName: string) {
    try {
      const permissions = await this.permissionModel
        .find({ 
          permissionGroup: groupName,
          isActive: true 
        })
        .sort({ permissionName: 1 })
        .lean();

      return {
        status: 'success',
        message: `Permissions for ${groupName} retrieved successfully`,
        data: permissions
      };
    } catch (error) {
      console.error('Error getting permissions by group:', error);
      throw new Error('Failed to get permissions by group');
    }
  }
}
