import 'reflect-metadata'
import { config } from 'dotenv'
config()

import { ValidationPipe, Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { AppModule } from './app.module'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import { GlobalExceptionFilter } from './common/filters/http-exception.filter'
import { randomUUID } from 'crypto'

const logger = new Logger('Bootstrap')

// ── Enforce PostgreSQL-only at startup ────────────────────────────────────────
const dbUrl = process.env.DATABASE_URL ?? ''
if (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
  logger.error('DATABASE_URL must be a PostgreSQL connection string (postgres:// or postgresql://). Aborting.')
  process.exit(1)
}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: process.env.NODE_ENV === 'development',
      // Stamp every request with a unique ID for tracing
      genReqId: () => randomUUID(),
    }),
    { bufferLogs: true },
  )

  const fastify = app.getHttpAdapter().getInstance()

  // ── Helmet — security headers ───────────────────────────────────────────────
  await app.register(import('@fastify/helmet'), {
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'"],
        styleSrc:    ["'self'", "'unsafe-inline'"],
        imgSrc:      ["'self'", 'data:'],
        connectSrc:  ["'self'"],
        frameSrc:    ["'none'"],
        objectSrc:   ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31_536_000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginEmbedderPolicy: false,
  })

  // ── CORS ───────────────────────────────────────────────────────────────────
  const allowedOrigins = [
    'http://localhost:3002',
    'http://localhost:3003',
    'https://vindicter.xyz',
    'https://dashboard.vindicter.xyz',
    ...(process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? []),
  ]

  await app.register(import('@fastify/cors'), {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true)
      } else {
        cb(new Error('Not allowed by CORS'), false)
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
    maxAge: 86_400,
  })

  // ── Rate limiting (Fastify-level fallback for non-NestJS routes) ───────────
  // Primary rate limiting is handled by @nestjs/throttler in AppModule.
  // This @fastify/rate-limit layer catches anything that bypasses NestJS routing.
  await app.register(import('@fastify/rate-limit'), {
    max: 200,
    timeWindow: '1 minute',
    errorResponseBuilder: (_req, context) => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests. Retry after ${context.after}.`,
      },
      meta: {
        requestId: randomUUID(),
        timestamp:  new Date().toISOString(),
        version:    'v1',
        retryAfter: context.after,
      },
    }),
  })

  // ── Request-ID propagation ──────────────────────────────────────────────────
  fastify.addHook('onRequest', async (req) => {
    if (!req.headers['x-request-id']) {
      req.headers['x-request-id'] = randomUUID()
    }
  })

  // ── Global prefix, interceptors, filters, validation ──────────────────────
  app.setGlobalPrefix('api/v1')

  app.useGlobalInterceptors(new ResponseInterceptor())
  app.useGlobalFilters(new GlobalExceptionFilter())

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:             true,
      forbidNonWhitelisted:  false,
      transform:             true,
      disableErrorMessages:  process.env.NODE_ENV === 'production',
    }),
  )

  const port = Number(process.env.PORT ?? 4000)
  await app.listen(port, '0.0.0.0')
  logger.log(`Vindicter API → http://localhost:${port}/api/v1  [${process.env.NODE_ENV ?? 'development'}]`)
}

bootstrap().catch((err) => {
  logger.error('Fatal startup error', err)
  process.exit(1)
})
