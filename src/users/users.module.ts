import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { Project, ProjectSchema } from '../dashboard/project.schema';
import { Transaction, TransactionSchema } from '../payment-history/transaction.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Transaction.name, schema: TransactionSchema }
    ]),
    AdminModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}






