import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class UrlLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('RequestLogger');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, ip } = request;
    
    const startTime = Date.now();
    
    

    return next.handle().pipe(
      tap({
        next: (data) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const statusCode = response.statusCode;
          
          // Log the response
          this.logger.log(
            `📤 ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms`
          );
        },
        error: (error) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const statusCode = error.status || 500;
          
          // Log the error response
          this.logger.error(
            `❌ ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms - Error: ${error.message}`
          );
        },
      }),
    );
  }
}
