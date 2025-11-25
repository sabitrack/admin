import { IsEnum, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GrantAdminDto {
  @ApiProperty({ 
    enum: ['admin', 'super_admin'], 
    example: 'admin' 
  })
  @IsEnum(['admin', 'super_admin'])
  role: 'admin' | 'super_admin';

  @ApiProperty({ example: 'Promoted to admin for excellent performance' })
  @IsString()
  @MinLength(5)
  reason: string;
}




























