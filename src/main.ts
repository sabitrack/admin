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
    .setDescription(process.env.ADMIN_API_DESCRIPTION || 'Independent admin management system for SabiTrack')
    .setVersion(process.env.ADMIN_API_VERSION || '1.0.0')
    .addBearerAuth(
      { 
        type: 'http', 
        scheme: 'bearer', 
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token'
      }, 
      'admin-auth'
    )
    .addTag('auth', 'Admin authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('audit', 'Audit log endpoints')
    .addTag('admin', 'Admin management endpoints')
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

