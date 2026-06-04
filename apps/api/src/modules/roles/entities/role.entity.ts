import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { RoleAccess } from './role-access.entity'
import { UserRole } from './user-role.entity'

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true, length: 50 })
  name: string

  @Column({ type: 'varchar', nullable: true, length: 255 })
  description: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @OneToMany(() => RoleAccess, (ra) => ra.role, { cascade: true })
  roleAccesses: RoleAccess[]

  @OneToMany(() => UserRole, (ur) => ur.role, { cascade: true })
  userRoles: UserRole[]
}
