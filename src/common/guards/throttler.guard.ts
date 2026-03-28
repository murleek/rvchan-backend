import {
  ThrottlerGuard as _ThrottlerGuard,
  ThrottlerLimitDetail,
} from '@nestjs/throttler';
import {
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Injectable()
export class ThrottlerGuard extends _ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.user?.id?.toString() ?? req.ip;
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimit: ThrottlerLimitDetail,
  ) {
    throw new HttpException(
      {
        message: 'too_many_requests',
        retryAfter: throttlerLimit.timeToExpire,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
