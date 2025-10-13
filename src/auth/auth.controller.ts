import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Admin login',
    description: `
      Login with seeded admin credentials:
      
      **Super Admin:**
      - Email: superadmin@sabitrack.com
      - Password: SuperAdmin123!
      
      **Regular Admin:**
      - Email: admin@sabitrack.com
      - Password: Admin123!
    `
  })
  @ApiBody({ 
    type: LoginDto,
    examples: {
      superAdmin: {
        summary: 'Super Admin Login',
        description: 'Login as Super Administrator',
        value: {
          email: 'superadmin@sabitrack.com',
          password: 'SuperAdmin123!'
        }
      },
      regularAdmin: {
        summary: 'Regular Admin Login',
        description: 'Login as Regular Administrator',
        value: {
          email: 'admin@sabitrack.com',
          password: 'Admin123!'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        refresh_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        admin: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', example: 'superadmin@sabitrack.com' },
            fullName: { type: 'string', example: 'Super Administrator' },
            role: { type: 'string', example: 'SUPER_ADMIN' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Request() req) {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    return await this.authService.login(loginDto, ipAddress);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Request() req) {
    // In a more sophisticated implementation, you might want to blacklist the token
    // For now, we'll just return a success message
    return { message: 'Logout successful' };
  }
}


