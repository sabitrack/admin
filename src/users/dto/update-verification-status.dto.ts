import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateVerificationStatusDto {
  @ApiProperty({ 
    enum: ['pending', 'approved', 'rejected'], 
    example: 'approved' 
  })
  @IsEnum(['pending', 'approved', 'rejected'])
  status: 'pending' | 'approved' | 'rejected';

  @ApiProperty({ example: 'Documents verified successfully', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}


