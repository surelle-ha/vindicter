import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Workspace } from './workspace.entity'

@Entity('workspace_invitations')
export class WorkspaceInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace

  @Column({ name: 'inviter_id', type: 'uuid' })
  inviterId: string

  @Column({ name: 'invitee_email', length: 255 })
  inviteeEmail: string

  @Column({ length: 20, default: 'pending' })
  status: string

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
