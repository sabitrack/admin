import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role, RoleDocument } from './role.schema';
import { Admin, AdminDocument } from './admin.schema';
import { Permission, PermissionDocument } from './permission.schema';

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    @InjectModel(Permission.name) private permissionModel: Model<PermissionDocument>,
  ) {}

  /**
   * Create a new role
   */
  async createRole(roleData: any, createdBy: string) {
    try {
      // Check if role name already exists
      const existingRole = await this.roleModel.findOne({ 
        name: { $regex: new RegExp(`^${roleData.name}$`, 'i') } 
      });
      
      if (existingRole) {
        throw new ConflictException('Role with this name already exists');
      }

      // Validate permission IDs if provided
      if (roleData.permissions && roleData.permissions.length > 0) {
        // First validate that all IDs are valid ObjectId format
        const invalidIds = roleData.permissions.filter(id => !Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
          throw new BadRequestException(`Invalid permission ID format: ${invalidIds.join(', ')}`);
        }

        const validPermissions = await this.permissionModel.find({
          _id: { $in: roleData.permissions.map(id => new Types.ObjectId(id)) }
        });
        
        if (validPermissions.length !== roleData.permissions.length) {
          throw new BadRequestException('One or more permission IDs do not exist in the database');
        }
      }

      // Validate admin IDs if provided
      let assignedAdminIds = [];
      if (roleData.assignedAdmins && roleData.assignedAdmins.length > 0) {
        // Validate admin IDs
        const invalidAdminIds = roleData.assignedAdmins.filter(id => !Types.ObjectId.isValid(id));
        if (invalidAdminIds.length > 0) {
          throw new BadRequestException(`Invalid admin ID format: ${invalidAdminIds.join(', ')}`);
        }

        const validAdmins = await this.adminModel.find({
          _id: { $in: roleData.assignedAdmins.map(id => new Types.ObjectId(id)) }
        });
        
        if (validAdmins.length !== roleData.assignedAdmins.length) {
          throw new BadRequestException('One or more admin IDs do not exist in the database');
        }

        assignedAdminIds = roleData.assignedAdmins.map(id => new Types.ObjectId(id));
      }

      const role = new this.roleModel({
        name: roleData.name,
        description: roleData.description,
        priority: roleData.priority || 'medium',
        isActive: roleData.isActive !== undefined ? roleData.isActive : true,
        isSystemRole: roleData.isSystemRole || false,
        permissions: roleData.permissions ? roleData.permissions.map(id => new Types.ObjectId(id)) : [],
        createdBy: new Types.ObjectId(createdBy),
        assignedAdmins: assignedAdminIds
      });

      await role.save();

      // If admins were assigned, also update their roles array
      if (assignedAdminIds.length > 0) {
        await this.adminModel.updateMany(
          { _id: { $in: assignedAdminIds } },
          { $addToSet: { roles: role._id } }
        );
      }
      
      // Populate permissions in response
      const populatedRole = await this.roleModel
        .findById(role._id)
        .populate('permissions', 'permissionName permissionGroup description')
        .populate('assignedAdmins', 'fullName email')
        .populate('createdBy', 'fullName email')
        .lean();

      return {
        status: 'success',
        message: 'Role created successfully',
        data: populatedRole
      };
    } catch (error) {
      console.error('Error creating role:', error);
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create role');
    }
  }

  /**
   * Get all roles with pagination and filters
   */
  async getAllRoles(page: number = 1, limit: number = 10, filters: any = {}) {
    try {
      const skip = (page - 1) * limit;
      const query: any = {};

      // Apply filters
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ];
      }

      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      if (filters.isSystemRole !== undefined) {
        query.isSystemRole = filters.isSystemRole;
      }

      if (filters.priority) {
        query.priority = filters.priority;
      }

      const roles = await this.roleModel
        .find(query)
        .populate('permissions', 'permissionName permissionGroup description')
        .populate('assignedAdmins', 'fullName email')
        .populate('createdBy', 'fullName email')
        .populate('updatedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await this.roleModel.countDocuments(query);

      return {
        status: 'success',
        message: 'Roles retrieved successfully',
        data: {
          roles,
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
      console.error('Error getting roles:', error);
      throw new BadRequestException('Failed to get roles');
    }
  }

  /**
   * Get role by ID
   */
  async getRoleById(roleId: string) {
    try {
      const role = await this.roleModel
        .findById(roleId)
        .populate('permissions', 'permissionName permissionGroup description')
        .populate('assignedAdmins', 'fullName email userType')
        .populate('createdBy', 'fullName email')
        .populate('updatedBy', 'fullName email')
        .lean();

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      return {
        status: 'success',
        message: 'Role retrieved successfully',
        data: role
      };
    } catch (error) {
      console.error('Error getting role:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to get role');
    }
  }

  /**
   * Update role
   */
  async updateRole(roleId: string, updateData: any, updatedBy: string) {
    try {
      const role = await this.roleModel.findById(roleId);
      
      if (!role) {
        throw new NotFoundException('Role not found');
      }

      // Prevent updating system roles
      if (role.isSystemRole) {
        throw new BadRequestException('Cannot update system roles');
      }

      // Check if new name conflicts with existing roles
      if (updateData.name && updateData.name !== role.name) {
        const existingRole = await this.roleModel.findOne({ 
          name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
          _id: { $ne: roleId }
        });
        
        if (existingRole) {
          throw new ConflictException('Role with this name already exists');
        }
      }

      // Validate permission IDs if provided
      if (updateData.permissions && updateData.permissions.length > 0) {
        // First validate that all IDs are valid ObjectId format
        const invalidIds = updateData.permissions.filter(id => !Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
          throw new BadRequestException(`Invalid permission ID format: ${invalidIds.join(', ')}`);
        }

        const validPermissions = await this.permissionModel.find({
          _id: { $in: updateData.permissions.map(id => new Types.ObjectId(id)) }
        });
        
        if (validPermissions.length !== updateData.permissions.length) {
          throw new BadRequestException('One or more permission IDs do not exist in the database');
        }
        updateData.permissions = updateData.permissions.map(id => new Types.ObjectId(id));
      }

      updateData.updatedBy = new Types.ObjectId(updatedBy);
      
      const updatedRole = await this.roleModel
        .findByIdAndUpdate(roleId, updateData, { new: true })
        .populate('permissions', 'permissionName permissionGroup description')
        .populate('assignedAdmins', 'fullName email userType')
        .populate('createdBy', 'fullName email')
        .populate('updatedBy', 'fullName email')
        .lean();

      return {
        status: 'success',
        message: 'Role updated successfully',
        data: updatedRole
      };
    } catch (error) {
      console.error('Error updating role:', error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to update role');
    }
  }

  /**
   * Delete role
   */
  async deleteRole(roleId: string) {
    try {
      const role = await this.roleModel.findById(roleId);
      
      if (!role) {
        throw new NotFoundException('Role not found');
      }

      // Prevent deleting system roles
      if (role.isSystemRole) {
        throw new BadRequestException('Cannot delete system roles');
      }

      // Check if role is assigned to any admins
      if (role.assignedAdmins.length > 0) {
        throw new BadRequestException('Cannot delete role that is assigned to admins');
      }

      await this.roleModel.findByIdAndDelete(roleId);

      return {
        status: 'success',
        message: 'Role deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting role:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete role');
    }
  }

  /**
   * Assign role to admin
   */
  async assignRoleToAdmin(roleId: string, adminId: string) {
    try {
      const role = await this.roleModel.findById(roleId);
      if (!role) {
        throw new NotFoundException('Role not found');
      }

      const admin = await this.adminModel.findById(adminId);
      if (!admin) {
        throw new NotFoundException('Admin not found');
      }

      // Check if admin already has this role
      if (role.assignedAdmins.includes(new Types.ObjectId(adminId))) {
        throw new ConflictException('Admin already has this role');
      }

      // Add admin to role
      await this.roleModel.findByIdAndUpdate(roleId, {
        $addToSet: { assignedAdmins: new Types.ObjectId(adminId) }
      });

      // Add role to admin
      await this.adminModel.findByIdAndUpdate(adminId, {
        $addToSet: { roles: new Types.ObjectId(roleId) }
      });

      return {
        status: 'success',
        message: 'Role assigned to admin successfully'
      };
    } catch (error) {
      console.error('Error assigning role:', error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to assign role');
    }
  }

  /**
   * Remove role from admin
   */
  async removeRoleFromAdmin(roleId: string, adminId: string) {
    try {
      const role = await this.roleModel.findById(roleId);
      if (!role) {
        throw new NotFoundException('Role not found');
      }

      const admin = await this.adminModel.findById(adminId);
      if (!admin) {
        throw new NotFoundException('Admin not found');
      }

      // Remove admin from role
      await this.roleModel.findByIdAndUpdate(roleId, {
        $pull: { assignedAdmins: new Types.ObjectId(adminId) }
      });

      // Remove role from admin
      await this.adminModel.findByIdAndUpdate(adminId, {
        $pull: { roles: new Types.ObjectId(roleId) }
      });

      return {
        status: 'success',
        message: 'Role removed from admin successfully'
      };
    } catch (error) {
      console.error('Error removing role:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to remove role');
    }
  }

  /**
   * Get available permissions grouped by category
   */
  async getAvailablePermissions() {
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

      return {
        status: 'success',
        message: 'Available permissions retrieved successfully',
        data: groupedPermissions
      };
    } catch (error) {
      console.error('Error getting available permissions:', error);
      throw new BadRequestException('Failed to get available permissions');
    }
  }

  /**
   * Get permission IDs for easy testing
   */
  async getPermissionIds() {
    try {
      const permissions = await this.permissionModel
        .find({ isActive: true })
        .select('_id permissionName permissionGroup')
        .sort({ permissionGroup: 1, permissionName: 1 })
        .lean();

      return {
        status: 'success',
        message: 'Permission IDs retrieved successfully',
        data: permissions
      };
    } catch (error) {
      console.error('Error getting permission IDs:', error);
      throw new BadRequestException('Failed to get permission IDs');
    }
  }

  /**
   * Get admin IDs for easy role assignment
   */
  async getAdminIds() {
    try {
      const admins = await this.adminModel
        .find({ isActive: true })
        .select('_id fullName email role')
        .sort({ fullName: 1 })
        .lean();

      return {
        status: 'success',
        message: 'Admin IDs retrieved successfully',
        data: admins
      };
    } catch (error) {
      console.error('Error getting admin IDs:', error);
      throw new BadRequestException('Failed to get admin IDs');
    }
  }

  /**
   * Assign permissions to role
   */
  async assignPermissionsToRole(roleId: string, permissionIds: string[]) {
    try {
      const role = await this.roleModel.findById(roleId);
      if (!role) {
        throw new NotFoundException('Role not found');
      }

      // Validate permission IDs
      const invalidIds = permissionIds.filter(id => !Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        throw new BadRequestException(`Invalid permission ID format: ${invalidIds.join(', ')}`);
      }

      const validPermissions = await this.permissionModel.find({
        _id: { $in: permissionIds.map(id => new Types.ObjectId(id)) }
      });
      
      if (validPermissions.length !== permissionIds.length) {
        throw new BadRequestException('One or more permission IDs do not exist in the database');
      }

      // Update role with new permissions
      await this.roleModel.findByIdAndUpdate(roleId, {
        permissions: permissionIds.map(id => new Types.ObjectId(id))
      });

      // Get updated role with populated permissions
      const updatedRole = await this.roleModel
        .findById(roleId)
        .populate('permissions', 'permissionName permissionGroup description')
        .lean();

      return {
        status: 'success',
        message: 'Permissions assigned to role successfully',
        data: updatedRole
      };
    } catch (error) {
      console.error('Error assigning permissions to role:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to assign permissions to role');
    }
  }
}
