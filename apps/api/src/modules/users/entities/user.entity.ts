import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Exclude } from 'class-transformer'
import { UserRole } from '../../roles/entities/user-role.entity'
import { ApiToken } from '../../api-tokens/entities/api-token.entity'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true, length: 255 })
  email: string

  @Column({ name: 'first_name', type: 'varchar', nullable: true, length: 100 })
  firstName: string | null

  @Column({ name: 'last_name', type: 'varchar', nullable: true, length: 100 })
  lastName: string | null

  @Column({ name: 'password_hash', length: 255 })
  @Exclude()
  passwordHash: string

  @Column({ name: 'job_role', type: 'varchar', nullable: true, length: 100 })
  jobRole: string | null

  @Column({ name: 'experience_level', type: 'varchar', nullable: true, length: 100 })
  experienceLevel: string | null

  @Column({ name: 'onboarding_complete', default: false })
  onboardingComplete: boolean

  @Column({ name: 'is_active', default: true })
  isActive: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @OneToMany(() => UserRole, (ur) => ur.user, { cascade: true })
  userRoles: UserRole[]

  @OneToMany(() => ApiToken, (t) => t.user, { cascade: true })
  apiTokens: ApiToken[]

  get fullName(): string | null {
    const parts = [this.firstName, this.lastName].filter(Boolean)
    return parts.length ? parts.join(' ') : null
  }
}
