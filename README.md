# SabiTrack Admin API

Independent admin management system for SabiTrack, running on port 3002 with separate JWT authentication and comprehensive user management capabilities.

## Features

- 🔐 **Separate Authentication**: Independent JWT authentication with `ADMIN_JWT_SECRET`
- 👥 **User Management**: Full CRUD operations, ban/unban, verification status management
- 🛡️ **Role-based Access**: Super Admin and Admin roles with different permissions
- 📊 **Audit Logging**: Complete audit trail of all admin actions
- 📚 **API Documentation**: Swagger UI at `/api-docs`
- 🗄️ **Shared Database**: Connects to same MongoDB as main backend

## Quick Start

### 1. Setup Environment

```bash
# Copy environment template
cp env.example .env

# Update .env with your MongoDB URI
MONGO_URI=mongodb://localhost:27017/sabitrack
ADMIN_JWT_SECRET=your-super-secret-admin-jwt-key-here
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Seed Initial Admin

```bash
npm run seed
```

This creates:
- **Super Admin**: `superadmin@sabitrack.com` / `SuperAdmin123!`
- **Regular Admin**: `admin@sabitrack.com` / `Admin123!`

### 4. Start Development Server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3002`

## API Documentation

Visit `http://localhost:3002/api-docs` for interactive Swagger documentation.

## Authentication

All endpoints (except login) require Bearer token authentication:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3002/users
```

## Key Endpoints

### Authentication
- `POST /auth/login` - Admin login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout

### User Management
- `GET /users` - List users (with pagination/filters)
- `GET /users/:id` - Get user details
- `POST /users` - Create user (Super Admin only)
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Soft delete user (Super Admin only)
- `POST /users/:id/ban` - Ban user
- `POST /users/:id/unban` - Unban user
- `PUT /users/:id/verification-status` - Update verification status
- `POST /users/:id/grant-admin` - Grant admin privileges (Super Admin only)
- `POST /users/:id/revoke-admin` - Revoke admin privileges (Super Admin only)

### Admin Management
- `GET /admin/list` - List all admins (Super Admin only)
- `POST /admin/create` - Create admin (Super Admin only)
- `PUT /admin/:id/role` - Update admin role (Super Admin only)
- `PUT /admin/:id/deactivate` - Deactivate admin (Super Admin only)
- `PUT /admin/change-password` - Change own password

### Audit Logs
- `GET /audit/logs` - Get audit logs
- `GET /audit/admin/:adminId` - Get admin activity (Super Admin only)
- `GET /audit/user/:userId` - Get user activity
- `GET /audit/stats` - Get audit statistics (Super Admin only)

## Role Permissions

### Super Admin
- All user management operations
- Create/manage other admins
- View all audit logs
- Access to statistics

### Admin
- View and update users
- Ban/unban users
- Update verification status
- View audit logs (limited)
- Cannot manage other admins

## Environment Variables

```env
# Database
MONGO_URI=mongodb://localhost:27017/sabitrack

# JWT Configuration
ADMIN_JWT_SECRET=your-super-secret-admin-jwt-key-here
ADMIN_TOKEN_EXPIRY=24h

# Server
PORT=3002
NODE_ENV=development

# API Info
ADMIN_API_TITLE=SabiTrack Admin API
ADMIN_API_DESCRIPTION=Independent admin management system
ADMIN_API_VERSION=1.0.0
```

## Database Schema

The admin API uses the same MongoDB database as the main backend but with additional collections:

- `admins` - Admin users (separate from regular users)
- `auditlogs` - Audit trail of all admin actions
- `users` - Regular users (shared with main backend)

## Security Features

- Separate JWT secret for admin authentication
- Role-based access control
- IP address tracking
- Activity logging
- Password hashing with bcrypt
- Input validation and sanitization

## Development

```bash
# Start development server
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run tests
npm run test

# Lint code
npm run lint
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use strong `ADMIN_JWT_SECRET`
3. Configure SSL certificates for HTTPS
4. Use PM2 or similar for process management
5. Set up proper MongoDB connection string

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check `MONGO_URI` in `.env`
   - Ensure MongoDB is running
   - Verify database permissions

2. **JWT Token Invalid**
   - Check `ADMIN_JWT_SECRET` is set
   - Ensure token is not expired
   - Verify Bearer token format

3. **Permission Denied**
   - Check user role (admin vs super_admin)
   - Verify JWT token contains correct role
   - Check endpoint permissions

### Logs

Check console output for detailed error messages and audit logs.

## Support

For issues or questions, check the audit logs and API documentation at `/api-docs`.






