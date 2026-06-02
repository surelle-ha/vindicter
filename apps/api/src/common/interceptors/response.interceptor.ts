import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable, map } from 'rxjs'
import { randomUUID } from 'crypto'

export interface ApiResponse<T> {
  success: true
  data: T
  meta: ResponseMeta
}

export interface ResponseMeta {
  requestId: string
  timestamp: string
  version: string
  path: string
  method: string
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const req = ctx.switchToHttp().getRequest()
    const meta: ResponseMeta = {
      requestId: (req.headers['x-request-id'] as string) || randomUUID(),
      timestamp:  new Date().toISOString(),
      version:    'v1',
      path:       req.url ?? req.raw?.url ?? '',
      method:     req.method ?? req.raw?.method ?? '',
    }

    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data: data ?? null,
        meta,
      })),
    )
  }
}
