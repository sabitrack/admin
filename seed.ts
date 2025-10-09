import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AdminService } from './src/admin/admin.service';
import { AdminRole } from './src/admin/admin.schema';

async function seedSuperAdmin() {
  console.log('🌱 Starting admin API seed process...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const adminService = app.get(AdminService);

  try {
    // Check if super admin already exists
    const existingSuperAdmin = await adminService.findByEmail('superadmin@sabitrack.com');
    
    if (existingSuperAdmin) {
      console.log('✅ Super admin already exists');
      console.log('Email: superadmin@sabitrack.com');
      console.log('Password: SuperAdmin123!');
      console.log('Role: SUPER_ADMIN');
    } else {
      // Create super admin
      const superAdmin = await adminService.createAdmin({
        email: 'superadmin@sabitrack.com',
        password: 'SuperAdmin123!',
        fullName: 'Super Administrator',
        role: AdminRole.SUPER_ADMIN,
        createdBy: 'system',
      });

      console.log('✅ Super admin created successfully!');
      console.log('Email: superadmin@sabitrack.com');
      console.log('Password: SuperAdmin123!');
      console.log('Role: SUPER_ADMIN');
      console.log('ID:', superAdmin._id);
    }

    // Create a regular admin for testing
    const existingAdmin = await adminService.findByEmail('admin@sabitrack.com');
    
    if (!existingAdmin) {
      const admin = await adminService.createAdmin({
        email: 'admin@sabitrack.com',
        password: 'Admin123!',
        fullName: 'Administrator',
        role: AdminRole.ADMIN,
        createdBy: 'system',
      });

      console.log('✅ Regular admin created successfully!');
      console.log('Email: admin@sabitrack.com');
      console.log('Password: Admin123!');
      console.log('Role: ADMIN');
      console.log('ID:', admin._id);
    } else {
      console.log('✅ Regular admin already exists');
    }

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    await app.close();
  }
}

// Run the seed function
seedSuperAdmin()
  .then(() => {
    console.log('🎉 Seed process completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Copy env.example to .env and update MONGO_URI');
    console.log('2. Run: npm install');
    console.log('3. Run: npm run start:dev');
    console.log('4. Visit: http://localhost:3002/api-docs');
    console.log('5. Login with superadmin@sabitrack.com / SuperAdmin123!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seed process failed:', error);
    process.exit(1);
  });
