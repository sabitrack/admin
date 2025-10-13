import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';
import { WalletModule } from './wallet/wallet.module';
import { PaymentHistoryModule } from './payment-history/payment-history.module';
import { ProjectManagementModule } from './project-management/project-management.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '.env'
    }),
    MongooseModule.forRoot(process.env.MONGO_URI),
    AdminModule,
    AuthModule,
    UsersModule,
    AuditModule,
    WalletModule,
    PaymentHistoryModule,
    ProjectManagementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

