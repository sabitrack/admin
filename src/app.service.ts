import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'SabiTrack Admin API is running!';
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'SabiTrack Admin API',
      version: process.env.ADMIN_API_VERSION || '1.0.0'
    };
  }
}
