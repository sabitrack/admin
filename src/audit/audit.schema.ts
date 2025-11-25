import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document & {
  _id: Types.ObjectId;
};

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ required: true })
  adminId: string;

  @Prop({ required: true })
  adminEmail: string;

  @Prop({ required: true })
  action: string;

  @Prop()
  targetUserId?: string;

  @Prop()
  targetUserEmail?: string;

  @Prop({ required: true })
  details: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);




























