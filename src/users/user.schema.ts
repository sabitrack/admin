import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document & {
  _id: Types.ObjectId;
};

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  userType: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: false })
  isAdmin: boolean;

  @Prop({ 
    enum: ['user', 'admin', 'super_admin'], 
    default: 'user' 
  })
  adminRole?: string;

  @Prop({
    type: [
      {
        action: { type: String },
        reason: { type: String },
        grantedBy: { type: String },
        grantedAt: { type: Date }
      }
    ],
    default: []
  })
  adminHistory?: Array<{
    action: string;
    reason: string;
    grantedBy: string;
    grantedAt: Date;
  }>;

  @Prop({ default: false })
  fullName?: string;

  @Prop()
  phoneNumber?: string;

  @Prop({
    minlength: [6, 'Password must be at least 6 characters long'],
  })
  password?: string;

  @Prop()
  preferredCurrency?: string;

  @Prop()
  region?: string;

  @Prop()
  organization?: string;

  @Prop()
  referralCode?: string;

  @Prop()
  organizationSize?: string;

  @Prop({ type: [String], default: [] })
  industryCategories?: string[];

  @Prop()
  twoFactorAuth?: boolean;

  @Prop()
  smsAuth?: boolean;

  @Prop()
  emailAuth?: boolean;

  @Prop()
  transactionPin?: string;

  @Prop()
  autoFundingMethod?: string;

  @Prop({ type: [String], default: [] })
  localPaymentOptions?: string[];

  @Prop({ type: [String], default: [] })
  internationalPaymentOptions?: string[];

  @Prop({ default: 1 })
  onboardingStep?: number;

  @Prop({ default: false })
  onboardingComplete?: boolean;

  @Prop({
    type: Object,
    default: {
      personalInfo: false,
      businessInfo: false,
      securitySetup: false,
      walletSetup: false,
    },
  })
  onboardingSections?: {
    personalInfo: boolean;
    businessInfo: boolean;
    securitySetup: boolean;
    walletSetup: boolean;
  };

  @Prop()
  onboardingToken?: string;

  @Prop()
  onboardingTokenExpires?: Date;

  @Prop()
  profilePicture?: string;

  @Prop({ default: false })
  deleted?: boolean;

  @Prop()
  deleteReason?: string;

  @Prop()
  deleteDetails?: string;

  @Prop()
  deleteRequestedAt?: Date;

  @Prop({ type: [String], default: [] })
  areaOfExpertise?: string[];

  @Prop()
  portfolioLink?: string;

  @Prop()
  businessType?: string;

  @Prop({ type: [String], default: [] })
  operatingDays?: string[];

  @Prop({ type: Object, default: { from: '', to: '' } })
  operatingHours?: { from: string; to: string };

  @Prop({ type: [String], default: [] })
  portfolioShowcase?: string[];

  @Prop({ type: [String], default: [] })
  portfolioLinks?: string[];

  @Prop()
  idType?: string;

  @Prop()
  idFile?: string;

  @Prop()
  businessProofType?: string;

  @Prop({ type: [String], default: [] })
  businessProofFiles?: string[];

  @Prop({ default: 'pending' })
  verificationStatus?: string;

  @Prop({
    type: [
      {
        status: { type: String, enum: ['pending', 'approved', 'rejected'] },
        reason: { type: String },
        verifiedBy: { type: String },
        verifiedAt: { type: Date }
      }
    ],
    default: []
  })
  verificationHistory?: Array<{
    status: 'pending' | 'approved' | 'rejected';
    reason: string;
    verifiedBy: string;
    verifiedAt: Date;
  }>;

  @Prop({
    type: [
      {
        bankName: { type: String },
        accountNumber: { type: String },
        accountName: { type: String },
        bankCode: { type: String },
        _id: { type: String, required: false },
      },
    ],
    default: [],
  })
  bankAccounts?: Array<{
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode: string;
    _id?: string;
  }>;

  @Prop({
    type: [
      {
        bankName: { type: String },
        accountNumber: { type: String },
        accountName: { type: String },
        bankCode: { type: String },
        _id: { type: String, required: false },
      },
    ],
    default: [],
  })
  debitCards?: Array<{
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode: string;
    _id?: string;
  }>;

  @Prop({ type: [String], default: [] })
  mutedChatRooms?: string[];

  @Prop({ type: [String], default: [] })
  deviceTokens?: string[];

  @Prop()
  firebaseToken?: string;

  @Prop({ type: Number, default: 0 })
  balance: number;

  @Prop({ type: Number, default: 0 })
  projectBalance: number;

  @Prop({ default: false })
  projectRunner?: boolean;

  @Prop({
    type: Object,
    default: {
      pushNotifications: true,
      securityAlerts: true,
      accountActivity: true,
      offersAndAnnouncements: false,
      emailNotifications: true
    }
  })
  notificationSettings?: {
    pushNotifications: boolean;
    securityAlerts: boolean;
    accountActivity: boolean;
    offersAndAnnouncements: boolean;
    emailNotifications: boolean;
  };

  @Prop({
    type: Object,
    default: {
      requireFaceId: true,
      requirePin: true,
      allowClipboardAccess: true,
      autoLogoutType: 'password_free'
    }
  })
  securityPreferences?: {
    requireFaceId: boolean;
    requirePin: boolean;
    allowClipboardAccess: boolean;
    autoLogoutType: 'password_free' | '60_minute' | 'always_password';
  };

  // Additional fields for admin management
  @Prop({ default: false })
  isBanned?: boolean;

  @Prop()
  banReason?: string;

  @Prop()
  bannedBy?: string;

  @Prop()
  bannedAt?: Date;

  @Prop()
  unbanReason?: string;

  @Prop()
  unbannedBy?: string;

  @Prop()
  unbannedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.set('timestamps', true);

