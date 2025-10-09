import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminService } from '../admin/admin.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private adminService: AdminService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto, ipAddress: string) {
    const { email, password } = loginDto;
    
    const admin = await this.adminService.findByEmail(email);
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.adminService.validatePassword(admin, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.adminService.updateLastLogin(admin._id.toString(), ipAddress);

    // Log login activity
    await this.adminService.logActivity(
      admin._id.toString(),
      'LOGIN',
      'Admin logged in successfully',
      ipAddress
    );

    const payload = {
      sub: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { 
      expiresIn: '7d' 
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      admin: {
        id: admin._id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(refreshTokenDto.refresh_token);
      
      const admin = await this.adminService.findById(payload.sub);
      if (!admin || !admin.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = {
        sub: admin._id.toString(),
        email: admin.email,
        role: admin.role,
      };

      const accessToken = this.jwtService.sign(newPayload);

      return {
        access_token: accessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateAdmin(adminId: string): Promise<any> {
    const admin = await this.adminService.findById(adminId);
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Admin not found or inactive');
    }
    return admin;
  }
}
