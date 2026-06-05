import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CorsOrigin } from './entities/cors-origin.entity'
import { CorsController } from './cors.controller'
import { CorsService } from './cors.service'

@Module({
  imports: [TypeOrmModule.forFeature([CorsOrigin])],
  controllers: [CorsController],
  providers: [CorsService],
  exports: [CorsService],
})
export class CorsModule {}
