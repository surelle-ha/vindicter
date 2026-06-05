import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm'

@Entity('academy_progress')
@Unique(['userId', 'lessonId'])
export class AcademyProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string

  @Column({ name: 'lesson_id', length: 100 })
  lessonId: string

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null
}
