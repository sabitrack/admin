import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true, _id: false })
export class Project {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ required: false })
  name: string;

  @Prop({ required: false })
  industryCategory: string;

  @Prop({ required: false })
  description: string;

  @Prop({ required: false })
  duration: string;

  @Prop({ required: false })
  startDate: Date;

  @Prop({ required: false })
  endDate: Date;

  @Prop({ required: false })
  preferredCurrency: string;

  @Prop({ required: false })
  totalBudget: number;

  @Prop({ required: false })
  budgetType: string;

  @Prop()
  budgetNotes?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Milestone' }], default: [] })
  milestones: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  vendorIds: Types.ObjectId[];

  @Prop({ default: 'draft' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop({ default: 'basic-info' })
  draftPhase: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ default: true })
  allowVendorNegotiate: boolean;

  @Prop({
    type: {
      runnerId: { type: Types.ObjectId, ref: 'User' },
      fullName: { type: String },
      email: { type: String },
      expertise: { type: String },
      startDate: { type: Date },
      endDate: { type: Date },
      preferredCurrency: { type: String },
      totalBudget: { type: Number },
      budgetType: { type: String },
      responsibility: { type: String },
    },
    required: false,
    default: null,
  })
  projectRunner?: {
    runnerId?: Types.ObjectId;
    fullName?: string;
    email?: string;
    expertise?: string;
    startDate?: Date;
    endDate?: Date;
    preferredCurrency?: string;
    totalBudget?: number;
    budgetType?: string;
    responsibility?: string;
  };

  @Prop({ type: [String], default: [] })
  projectRunnerDeliverables?: string[];

  @Prop({
    type: [
      {
        type: { type: String },
        description: { type: String },
        budget: { type: Number },
        budgetType: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
      },
    ],
    default: [],
  })
  addons?: Array<{
    type: string;
    description: string;
    budget: number;
    budgetType: string;
    startDate: Date;
    endDate: Date;
  }>;

  @Prop({ type: [String], default: [] })
  subProjectIds: string[];

  @Prop({
    type: [
      {
        milestoneId: { type: Types.ObjectId, required: true },
        amount: { type: Number, default: 0 },
      },
    ],
    default: [],
  })
  wallet?: Array<{ milestoneId: Types.ObjectId; amount: number }>;

  @Prop({
    type: Date,
    default: Date.now,
  })
  createdAt?: Date;

  @Prop({
    type: Date,
    default: Date.now,
  })
  updatedAt?: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
