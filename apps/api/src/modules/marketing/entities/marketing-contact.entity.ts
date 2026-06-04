import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { MarketingSegment } from './marketing-segment.entity'

export type MarketingContactStatus = 'subscribed' | 'bounced' | 'unsubscribed'

@Entity('marketing_contacts')
export class MarketingContact {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 255 })
  email: string

  @Column({ type: 'varchar', nullable: true, length: 120 })
  name: string | null

  @Column({ type: 'varchar', nullable: true, length: 120 })
  company: string | null

  @Column({ type: 'varchar', length: 20, default: 'subscribed' })
  status: MarketingContactStatus

  @Column({ name: 'last_engaged_at', type: 'timestamptz', nullable: true })
  lastEngagedAt: Date | null

  @ManyToOne(() => MarketingSegment, (segment) => segment.contacts, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'segment_id' })
  segment: MarketingSegment | null

  @Column({ name: 'segment_id', type: 'uuid', nullable: true })
  segmentId: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
