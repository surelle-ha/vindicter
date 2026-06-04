import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { MarketingContact } from './marketing-contact.entity'

export type MarketingSegmentStatus = 'active' | 'draft' | 'paused'

@Entity('marketing_segments')
export class MarketingSegment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 120 })
  name: string

  @Column({ length: 120, default: 'Internal list' })
  source: string

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: MarketingSegmentStatus

  @Column({ name: 'owner_team', length: 80, default: 'Marketing' })
  ownerTeam: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @OneToMany(() => MarketingContact, (contact) => contact.segment)
  contacts: MarketingContact[]
}
