import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

export type TicketCategory = 'setup' | 'scan' | 'billing' | 'bug' | 'other'
export type TicketStatus = 'open' | 'reviewing' | 'closed'

@Entity('api_support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 255 })
  name: string

  @Column({ length: 255 })
  email: string

  @Column({ type: 'varchar', length: 50 })
  category: TicketCategory

  @Column({ length: 255 })
  subject: string

  @Column({ type: 'text' })
  message: string

  @Column({ name: 'documentation_checked', default: false })
  documentationChecked: boolean

  @Column({ name: 'faq_checked', default: false })
  faqChecked: boolean

  @Column({ name: 'source_url', nullable: true, length: 500 })
  sourceUrl: string | null

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: TicketStatus

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
