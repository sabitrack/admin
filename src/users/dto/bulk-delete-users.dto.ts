import { IsArray, ArrayNotEmpty, IsString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkDeleteUsersDto {
  @ApiProperty({
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    description: 'Array of user IDs to delete',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'User IDs array cannot be empty' })
  @ArrayMinSize(1, { message: 'At least one user ID is required' })
  @IsString({ each: true, message: 'Each user ID must be a string' })
  userIds: string[];
}

