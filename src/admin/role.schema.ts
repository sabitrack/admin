import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema({ timestamps: true })
export class Role {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ 
    type: [Types.ObjectId], 
    ref: 'Permission',
    default: [] 
  })
  permissions: Types.ObjectId[];

  @Prop({ 
    type: [Types.ObjectId], 
    ref: 'Admin',
    default: [] 
  })
  assignedAdmins: Types.ObjectId[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isSystemRole: boolean; // For default system roles that can't be deleted

  @Prop({ 
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  })
  priority: string;

  @Prop()
  createdBy: Types.ObjectId;

  @Prop()
  updatedBy: Types.ObjectId;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
