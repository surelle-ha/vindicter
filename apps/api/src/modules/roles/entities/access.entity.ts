import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { RoleAccess } from './role-access.entity'

@Entity('api_accesses')
export class Access {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 100 })
  resource: string

  @Column({ length: 50 })
  action: string

  @Column({ nullable: true, length: 255 })
  description: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @OneToMany(() => RoleAccess, (ra) => ra.access, { cascade: true })
  roleAccesses: RoleAccess[]
}
