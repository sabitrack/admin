import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApprovePaymentDto {
  @ApiPropertyOptional({
    description: 'Optional reason or notes for approval',
    example: 'Receipt verified and payment confirmed',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

