import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { User, UserSchema } from '../users/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService]
})
export class WalletModule {}




