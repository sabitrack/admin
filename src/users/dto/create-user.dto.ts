import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'client' })
  @IsString()
  userType: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;
}























