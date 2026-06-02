import 'reflect-metadata'
import { config } from 'dotenv'
config()

import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: process.env.NODE_ENV === 'development' }),
  )

  app.enableCors({
    origin: [
      'http://localhost:3002',
      'http://localhost:3003',
      'https://vindicter.xyz',
      'https://dashboard.vindicter.xyz',
      ...(process.env.CORS_ORIGINS?.split(',') ?? []),
    ],
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  )

  app.setGlobalPrefix('api/v1')

  const port = Number(process.env.PORT ?? 4000)
  await app.listen(port, '0.0.0.0')
  console.log(`Vindicter API running on http://localhost:${port}/api/v1`)
}

bootstrap().catch(console.error)
