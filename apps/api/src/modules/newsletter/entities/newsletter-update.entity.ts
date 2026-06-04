import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export type NewsletterUpdateStatus = 'draft' | 'published' | 'archived'

@Entity('newsletter_updates')
export class NewsletterUpdate {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 255 })
  title: string

  @Column({ nullable: true, type: 'text' })
  summary: string | null

  @Column({ type: 'text' })
  body: string

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: NewsletterUpdateStatus

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
