import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

export type BetaStatus = 'pending' | 'approved' | 'rejected'

@Entity('api_special_beta_applications')
export class SpecialBetaApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'org_name', length: 255 })
  orgName: string

  @Column({ name: 'org_size', length: 50 })
  orgSize: string

  @Column({ length: 100 })
  country: string

  @Column({ name: 'contact_name', length: 255 })
  contactName: string

  @Column({ name: 'contact_email', length: 255 })
  contactEmail: string

  @Column({ name: 'partner_type', length: 50, default: 'organization' })
  partnerType: string

  @Column({ nullable: true, type: 'text' })
  referral: string | null

  @Column({ name: 'agreed_terms', default: false })
  agreedTerms: boolean

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: BetaStatus

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
