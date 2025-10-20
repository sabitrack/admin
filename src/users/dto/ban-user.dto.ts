import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BanUserDto {
  @ApiProperty({ example: 'Violation of terms of service' })
  @IsString()
  @MinLength(5)
  reason: string;
}






