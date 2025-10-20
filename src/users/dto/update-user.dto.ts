import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe Updated', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ example: 'USD', required: false })
  @IsOptional()
  @IsString()
  preferredCurrency?: string;

  @ApiProperty({ example: 'North America', required: false })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ example: 'Tech Corp', required: false })
  @IsOptional()
  @IsString()
  organization?: string;

  @ApiProperty({ example: 'large', required: false })
  @IsOptional()
  @IsString()
  organizationSize?: string;

  @ApiProperty({ example: ['technology', 'finance'], required: false })
  @IsOptional()
  industryCategories?: string[];

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  twoFactorAuth?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  smsAuth?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  emailAuth?: boolean;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  balance?: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  projectBalance?: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  projectRunner?: boolean;
}






