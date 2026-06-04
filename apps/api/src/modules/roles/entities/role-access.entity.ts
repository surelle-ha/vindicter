import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Role } from './role.entity'
import { Access } from './access.entity'

@Entity('roles_access')
export class RoleAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => Role, (r) => r.roleAccesses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role

  @ManyToOne(() => Access, (a) => a.roleAccesses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'access_id' })
  access: Access

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
