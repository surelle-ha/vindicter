import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AcademyProgress } from './entities/academy-progress.entity'
import { AcademyChatSession } from './entities/academy-chat-session.entity'
import { AcademyService } from './academy.service'
import { AcademyController } from './academy.controller'

@Module({
  imports: [TypeOrmModule.forFeature([AcademyProgress, AcademyChatSession])],
  controllers: [AcademyController],
  providers: [AcademyService],
})
export class AcademyModule {}
