import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AdminDocument = Admin & Document & {
  _id: Types.ObjectId;
};


@Schema({ timestamps: true })
export class Admin {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  fullName: string;


  @Prop({ 
    type: [Types.ObjectId], 
    ref: 'Role',
    default: [] 
  })
  roles: Types.ObjectId[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  lastLoginIp?: string;

  @Prop({ type: [String], default: [] })
  loginHistory: string[];

  @Prop({
    type: [
      {
        action: { type: String },
        details: { type: String },
        timestamp: { type: Date, default: Date.now },
        ipAddress: { type: String }
      }
    ],
    default: []
  })
  activityLogs: Array<{
    action: string;
    details: string;
    timestamp: Date;
    ipAddress: string;
  }>;

  @Prop()
  createdBy?: string;

  @Prop()
  updatedBy?: string;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
AdminSchema.set('timestamps', true);
