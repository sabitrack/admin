import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RejectPaymentDto {
  @ApiPropertyOptional({
    description: 'Reason for rejection',
    example: 'Receipt does not match payment amount',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

