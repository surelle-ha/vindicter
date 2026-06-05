import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DefendCoreConfig } from './entities/defendcore-config.entity'
import { KnowledgeDocument } from './entities/knowledge-document.entity'
import { DefendCoreController, DefendCorePublicController } from './defendcore.controller'
import { DefendCoreService } from './defendcore.service'

@Module({
  imports: [TypeOrmModule.forFeature([DefendCoreConfig, KnowledgeDocument])],
  controllers: [DefendCoreController, DefendCorePublicController],
  providers: [DefendCoreService],
})
export class DefendCoreModule {}
