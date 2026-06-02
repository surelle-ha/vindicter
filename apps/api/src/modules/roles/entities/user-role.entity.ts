import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { Role } from './role.entity'

@Entity('api_user_roles')
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User, (u) => u.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @ManyToOne(() => Role, (r) => r.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
