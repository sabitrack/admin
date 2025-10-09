import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'newSecurePassword123' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
