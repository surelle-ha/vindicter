import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SpecialBetaApplication } from './entities/special-beta-application.entity'
import { BetaController } from './beta.controller'
import { BetaService } from './beta.service'

@Module({
  imports: [TypeOrmModule.forFeature([SpecialBetaApplication])],
  controllers: [BetaController],
  providers: [BetaService],
})
export class BetaModule {}
