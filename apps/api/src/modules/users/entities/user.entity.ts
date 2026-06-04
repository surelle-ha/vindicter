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

  @Column({ name: 'display_name', type: 'varchar', nullable: true, length: 100 })
  displayName: string | null

  @Column({ name: 'password_hash', length: 255 })
  @Exclude()
  passwordHash: string

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
}
