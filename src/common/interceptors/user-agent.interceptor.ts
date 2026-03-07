import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { UAParser } from 'ua-parser-js';
import { Observable } from 'rxjs';

@Injectable()
export class UserAgentInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    const rawUA = request.headers['user-agent'] || '';
    const parser = new UAParser(rawUA);
    const result = parser.getResult();

    request.userAgent = {
      browser: result.browser.name || null,
      browserVersion: result.browser.version || null,
      os: result.os.name || null,
      osVersion: result.os.version || null,
      deviceType: result.device.type || 'desktop',
      deviceVendor: result.device.vendor || null,
      deviceModel: result.device.model || null,
      raw: rawUA,
    };

    return next.handle();
  }
}
