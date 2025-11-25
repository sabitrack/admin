import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicFundingController } from './public-funding.controller';
import { PublicFundingService } from './public-funding.service';
import { PublicFunding, PublicFundingSchema } from './public-funding.schema';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PublicFunding.name, schema: PublicFundingSchema },
    ]),
    AdminModule,
  ],
  controllers: [PublicFundingController],
  providers: [PublicFundingService],
  exports: [PublicFundingService],
})
export class PublicFundingModule {}

