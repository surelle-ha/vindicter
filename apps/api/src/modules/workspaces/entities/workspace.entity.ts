import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { WorkspaceMember } from './workspace-member.entity'
import { Subscription } from '../../subscriptions/entities/subscription.entity'

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 120 })
  name: string

  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @OneToMany(() => WorkspaceMember, (m) => m.workspace, { cascade: true })
  members: WorkspaceMember[]

  @OneToMany(() => Subscription, (s) => s.workspace, { cascade: true })
  subscriptions: Subscription[]
}
