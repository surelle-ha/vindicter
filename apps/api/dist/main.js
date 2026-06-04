"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const app_module_1 = require("./app.module");
const response_interceptor_1 = require("./common/interceptors/response.interceptor");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const crypto_1 = require("crypto");
const logger = new common_1.Logger('Bootstrap');
const dbUrl = process.env.DATABASE_URL ?? '';
if (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
    logger.error('DATABASE_URL must be a PostgreSQL connection string (postgres:// or postgresql://). Aborting.');
    process.exit(1);
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter({
        logger: process.env.NODE_ENV === 'development',
        genReqId: () => (0, crypto_1.randomUUID)(),
    }), { bufferLogs: true });
    const fastify = app.getHttpAdapter().getInstance();
    await app.register(Promise.resolve().then(() => require('@fastify/helmet')), {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:'],
                connectSrc: ["'self'"],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"],
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
    });
    const allowedOrigins = [
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:3004',
        'https://vindicter.xyz',
        'https://dashboard.vindicter.xyz',
        'https://marketing.vindicta.xyz',
        ...(process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? []),
    ];
    await app.register(Promise.resolve().then(() => require('@fastify/cors')), {
        origin: (origin, cb) => {
            if (!origin || allowedOrigins.includes(origin)) {
                cb(null, true);
            }
            else {
                cb(new Error('Not allowed by CORS'), false);
            }
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
        credentials: true,
        maxAge: 86_400,
    });
    await app.register(Promise.resolve().then(() => require('@fastify/rate-limit')), {
        max: 200,
        timeWindow: '1 minute',
        errorResponseBuilder: (_req, context) => ({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: `Too many requests. Retry after ${context.after}.`,
            },
            meta: {
                requestId: (0, crypto_1.randomUUID)(),
                timestamp: new Date().toISOString(),
                version: 'v1',
                retryAfter: context.after,
            },
        }),
    });
    fastify.addHook('onRequest', async (req) => {
        if (!req.headers['x-request-id']) {
            req.headers['x-request-id'] = (0, crypto_1.randomUUID)();
        }
    });
    app.setGlobalPrefix('api/v1');
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    app.useGlobalFilters(new http_exception_filter_1.GlobalExceptionFilter());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        disableErrorMessages: process.env.NODE_ENV === 'production',
    }));
    const port = Number(process.env.PORT ?? 4000);
    await app.listen(port, '0.0.0.0');
    logger.log(`Vindicter API → http://localhost:${port}/api/v1  [${process.env.NODE_ENV ?? 'development'}]`);
}
bootstrap().catch((err) => {
    logger.error('Fatal startup error', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map