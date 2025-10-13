import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';

async function bootstrap() {
  const logger = new Logger('AdminAPI Bootstrap');
  let app;
  let useHttps = false;

  try {
    const httpsOptions = {
      key: fs.readFileSync(
        '/etc/letsencrypt/live/admin-api.sabitrack.com/privkey.pem',
      ),
      cert: fs.readFileSync(
        '/etc/letsencrypt/live/admin-api.sabitrack.com/fullchain.pem',
      ),
    };
    app = await NestFactory.create(AppModule, { httpsOptions });
    useHttps = true;
    logger.log('🔒 HTTPS mode enabled with SSL certificates');
  } catch (error) {
    logger.warn(
      '⚠️  SSL certificates not accessible, falling back to HTTP mode',
    );
    logger.warn(`SSL Error: ${error.message}`);
    app = await NestFactory.create(AppModule);
    logger.log('🌐 HTTP mode enabled (no SSL)');
  }

  // Enable CORS
  app.enableCors({ 
    origin: true, 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle(process.env.ADMIN_API_TITLE || 'SabiTrack Admin API')
    .setDescription(`
      Independent admin management system for SabiTrack
      
      ## 🔐 Login Credentials
      
      **Super Admin:**
      - Email: \`superadmin@sabitrack.com\`
      - Password: \`SuperAdmin123!\`
      - Role: SUPER_ADMIN (Full access)
      
      **Regular Admin:**
      - Email: \`admin@sabitrack.com\`
      - Password: \`Admin123!\`
      - Role: ADMIN (Limited access)
      
      ## 🚀 Getting Started
      
      1. Use the **POST /auth/login** endpoint to authenticate
      2. Copy the returned \`accessToken\`
      3. Click the **Authorize** button above
      4. Enter: \`Bearer YOUR_TOKEN_HERE\`
      5. Start testing the endpoints!
      
      ## 📋 Available Endpoints
      
      - **Authentication**: Login, refresh, logout
      - **User Management**: CRUD operations, ban/unban, verification
      - **Wallet Information**: View user wallet data and payment methods
      - **Payment History**: Transaction tracking and analytics
      - **Project Management**: Project lifecycle and status tracking
      - **Admin Management**: Admin user management (Super Admin only)
      - **Audit Logs**: Complete activity tracking
    `)
    .setVersion(process.env.ADMIN_API_VERSION || '1.0.0')
    .addBearerAuth(
      { 
        type: 'http', 
        scheme: 'bearer', 
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token (e.g., Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)'
      }, 
      'admin-auth'
    )
    .addTag('auth', 'Admin authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('audit', 'Audit log endpoints')
    .addTag('admin', 'Admin management endpoints')
    .addTag('wallet', 'Wallet information endpoints')
    .addTag('payment-history', 'Payment history endpoints')
    .addTag('project-management', 'Project management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || (useHttps ? 443 : 3002);
  await app.listen(port, '0.0.0.0');

  const protocol = useHttps ? 'https' : 'http';
  logger.log(`🚀 Admin API is running on: ${protocol}://localhost:${port}`);
  logger.log(`📚 API Documentation available at: ${protocol}://localhost:${port}/api-docs`);
}

bootstrap();


