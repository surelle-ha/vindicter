import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { randomUUID } from 'crypto'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly log = new Logger(GlobalExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx  = host.switchToHttp()
    const req  = ctx.getRequest()
    const res  = ctx.getResponse()

    const isHttp    = exception instanceof HttpException
    const status    = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const rawResp   = isHttp ? exception.getResponse() : null

    const code = isHttp
      ? (typeof rawResp === 'object' && rawResp !== null && 'error' in rawResp
          ? String((rawResp as any).error)
          : HttpStatus[status] ?? 'HTTP_ERROR')
      : 'INTERNAL_SERVER_ERROR'

    const message = isHttp
      ? (typeof rawResp === 'string'
          ? rawResp
          : typeof rawResp === 'object' && rawResp !== null && 'message' in rawResp
            ? (Array.isArray((rawResp as any).message)
                ? (rawResp as any).message.join('; ')
                : String((rawResp as any).message))
            : 'An error occurred')
      : 'Internal server error'

    if (status >= 500) {
      this.log.error(`[${req.method}] ${req.url} → ${status}`, exception instanceof Error ? exception.stack : String(exception))
    }

    const body = {
      success: false,
      error: { code, message },
      meta: {
        requestId: (req.headers?.['x-request-id'] as string) || randomUUID(),
        timestamp:  new Date().toISOString(),
        version:    'v1',
        path:       req.url ?? '',
        method:     req.method ?? '',
      },
    }

    // Fastify uses res.code().send(); Express uses res.status().json()
    if (typeof res.code === 'function') {
      res.code(status).send(body)
    } else {
      res.status(status).json(body)
    }
  }
}
