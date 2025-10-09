import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { Request } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (response) => {
        try {
          const { method, url, body, query, params } = request;
          const ipAddress = request.ip || request.connection.remoteAddress || 'unknown';
          const userAgent = request.get('User-Agent') || 'unknown';

          // Determine action based on HTTP method and route
          let action = this.getActionFromRoute(method, url);
          
          // Extract target user ID if present
          let targetUserId = params?.id || body?.userId || query?.userId;
          let targetUserEmail = body?.email || query?.email;

          // Create details string
          let details = `${method} ${url}`;
          if (body && Object.keys(body).length > 0) {
            details += ` - Data: ${JSON.stringify(body)}`;
          }

          await this.auditService.logAction({
            adminId: (user as any).adminId,
            adminEmail: (user as any).email,
            action,
            targetUserId,
            targetUserEmail,
            details,
            ipAddress,
            userAgent,
            metadata: {
              method,
              url,
              params,
              query,
            },
          });
        } catch (error) {
          // Don't let audit logging break the main request
          console.error('Audit logging error:', error);
        }
      })
    );
  }

  private getActionFromRoute(method: string, url: string): string {
    const route = url.toLowerCase();
    
    if (route.includes('/auth/login')) return 'LOGIN';
    if (route.includes('/auth/logout')) return 'LOGOUT';
    if (route.includes('/users') && method === 'POST') return 'CREATE_USER';
    if (route.includes('/users') && method === 'PUT') return 'UPDATE_USER';
    if (route.includes('/users') && method === 'DELETE') return 'DELETE_USER';
    if (route.includes('/ban')) return 'BAN_USER';
    if (route.includes('/unban')) return 'UNBAN_USER';
    if (route.includes('/verification-status')) return 'UPDATE_VERIFICATION';
    if (route.includes('/grant-admin')) return 'GRANT_ADMIN';
    if (route.includes('/revoke-admin')) return 'REVOKE_ADMIN';
    if (route.includes('/admin/create')) return 'CREATE_ADMIN';
    if (route.includes('/admin') && method === 'PUT') return 'UPDATE_ADMIN';
    if (route.includes('/admin') && method === 'DELETE') return 'DELETE_ADMIN';
    
    return `${method}_${route.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
  }
}
