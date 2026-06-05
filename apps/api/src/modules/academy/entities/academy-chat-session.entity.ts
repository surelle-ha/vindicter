import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm'

@Entity('academy_chat_sessions')
@Unique(['userId', 'lessonId'])
export class AcademyChatSession {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string

  @Column({ name: 'lesson_id', length: 100 })
  lessonId: string

  @Column({ type: 'jsonb', default: [] })
  messages: any[]

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date
}
