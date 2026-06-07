import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm'
import { Workspace } from './workspace.entity'
import { User } from '../../users/entities/user.entity'

@Entity('workspace_members')
@Unique(['workspace', 'user'])
export class WorkspaceMember {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => Workspace, (w) => w.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ name: 'member_role', length: 20, default: 'member' })
  memberRole: string

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date
}
