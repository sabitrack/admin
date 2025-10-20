import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PermissionDocument = Permission & Document;

@Schema({ timestamps: true })
export class Permission {
  @Prop({ required: true, unique: true })
  permissionName: string;

  @Prop({ required: true })
  permissionGroup: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ 
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  })
  priority: string;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
