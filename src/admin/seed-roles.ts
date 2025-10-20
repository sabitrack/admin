import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { RoleService } from './role.service';

async function seedRoles() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const roleService = app.get(RoleService);

  try {
    console.log('🌱 Seeding default roles...');

    // Super Admin Role
    await roleService.createRole({
      name: 'Super Admin',
      description: 'Full access over every modules and system functions',
      permissions: [
        'users.view', 'users.create', 'users.edit', 'users.delete', 'users.ban', 'users.unban', 'users.verify', 'users.grant_admin', 'users.revoke_admin',
        'projects.view', 'projects.create', 'projects.edit', 'projects.delete', 'projects.assign', 'projects.approve', 'projects.reject',
        'payments.view', 'payments.process', 'payments.refund', 'payments.export',
        'dashboard.view', 'analytics.view', 'reports.generate',
        'system.settings', 'system.logs', 'system.backup', 'system.maintenance',
        'roles.view', 'roles.create', 'roles.edit', 'roles.delete', 'roles.assign',
        'admins.view', 'admins.create', 'admins.edit', 'admins.delete', 'admins.roles'
      ],
      priority: 'critical',
      isSystemRole: true,
      isActive: true
    }, 'system');

    // Admin Role
    await roleService.createRole({
      name: 'Admin',
      description: 'Full access over most modules with some restrictions',
      permissions: [
        'users.view', 'users.create', 'users.edit', 'users.ban', 'users.unban', 'users.verify',
        'projects.view', 'projects.create', 'projects.edit', 'projects.assign', 'projects.approve', 'projects.reject',
        'payments.view', 'payments.process', 'payments.export',
        'dashboard.view', 'analytics.view', 'reports.generate',
        'roles.view', 'roles.assign',
        'admins.view'
      ],
      priority: 'high',
      isSystemRole: true,
      isActive: true
    }, 'system');

    // Project Manager Role
    await roleService.createRole({
      name: 'Project Manager',
      description: 'Manages projects and assigns tasks to team members',
      permissions: [
        'projects.view', 'projects.create', 'projects.edit', 'projects.assign', 'projects.approve', 'projects.reject',
        'users.view', 'users.edit',
        'payments.view', 'payments.export',
        'dashboard.view', 'analytics.view'
      ],
      priority: 'medium',
      isSystemRole: false,
      isActive: true
    }, 'system');

    // Support Agent Role
    await roleService.createRole({
      name: 'Support Agent',
      description: 'Handles user support and basic administrative tasks',
      permissions: [
        'users.view', 'users.edit',
        'projects.view',
        'payments.view',
        'dashboard.view'
      ],
      priority: 'low',
      isSystemRole: false,
      isActive: true
    }, 'system');

    // Finance Manager Role
    await roleService.createRole({
      name: 'Finance Manager',
      description: 'Manages payments, refunds, and financial operations',
      permissions: [
        'payments.view', 'payments.process', 'payments.refund', 'payments.export',
        'users.view',
        'projects.view',
        'dashboard.view', 'analytics.view', 'reports.generate'
      ],
      priority: 'high',
      isSystemRole: false,
      isActive: true
    }, 'system');

    console.log('✅ Default roles seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
  } finally {
    await app.close();
  }
}

// Run the seeder
seedRoles();
