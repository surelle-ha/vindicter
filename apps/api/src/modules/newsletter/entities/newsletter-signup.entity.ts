import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('api_newsletter_signups')
export class NewsletterSignup {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true, length: 255 })
  email: string

  @Column({ name: 'download_token', unique: true, nullable: true, length: 100 })
  downloadToken: string | null

  @Column({ name: 'account_type', length: 50, default: 'individual' })
  accountType: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
