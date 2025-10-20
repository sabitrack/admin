import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  type: string; // 'topup', 'withdrawal', 'earning', etc.

  @Prop({ required: true })
  status: string; // 'pending', 'successful', 'failed'

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  channel: string;

  @Prop()
  recipient?: string;

  @Prop()
  sender?: string;

  @Prop()
  externalReference?: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
