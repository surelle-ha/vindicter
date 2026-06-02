import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { User } from '../../users/entities/user.entity'

@Entity('api_api_tokens')
export class ApiToken {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User, (u) => u.apiTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ length: 100 })
  name: string

  @Column({ unique: true, length: 255 })
  token: string

  @Column({ name: 'token_prefix', length: 20 })
  tokenPrefix: string

  @Column({ name: 'expires_at', nullable: true })
  expiresAt: Date | null

  @Column({ name: 'last_used_at', nullable: true })
  lastUsedAt: Date | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
