import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PublicFundingDocument = PublicFunding & Document;

@Schema({ timestamps: true })
export class PublicFunding {
  @Prop({ type: String, required: true, ref: 'Project' })
  projectId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  senderEmail: string;

  @Prop({ required: true })
  senderName: string;

  @Prop({ required: true })
  senderCountry: string;

  @Prop({
    required: true,
    enum: ['PAYPAL', 'STRIPE', 'CASHAPP', 'PAYSTACK'],
  })
  paymentChannel: string;

  @Prop({
    required: true,
    enum: ['PENDING', 'FAILED', 'SUCCESS'],
    default: 'PENDING',
  })
  paymentStatus: string;

  @Prop()
  transactionId?: string;

  @Prop()
  receiptUrl?: string;

  @Prop()
  adminApprovedBy?: string;

  @Prop()
  adminApprovedAt?: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt?: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt?: Date;
}

export const PublicFundingSchema = SchemaFactory.createForClass(PublicFunding);

// Indexes for better query performance
PublicFundingSchema.index({ projectId: 1 });
PublicFundingSchema.index({ paymentStatus: 1 });
PublicFundingSchema.index({ createdAt: -1 });
PublicFundingSchema.index({ senderEmail: 1 });
PublicFundingSchema.index({ paymentChannel: 1, paymentStatus: 1 });

