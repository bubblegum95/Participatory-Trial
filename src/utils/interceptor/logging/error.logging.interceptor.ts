import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { WINSTON_MODULE_OPTIONS } from 'nest-winston';
import { Observable, catchError, throwError } from 'rxjs';
import { winstonLogger } from '../../winston';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  constructor() {}
  private logger = winstonLogger;
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();

    const { url, method } = request;
    const referer = request.headers['referer'] || request.headers['referrer'];
    const userAgent = request.headers['user-agent'];
    const clientIp = request.headers['x-forwarded-for'] || request.ip;
    return next.handle().pipe(
      catchError((err) => {
        const response = httpContext.getResponse();
        const { statusCode } = response;
        this.logger.error(
          JSON.stringify({
            logLevel: 'error',
            timestamp: new Date().toISOString(),
            statusCode,
            url,
            message: err.message,
            method,
            referer,
            userAgent,
            clientIp,
          }),
        );
        return throwError(() => err);
      }),
    );
  }
}
