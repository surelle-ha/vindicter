import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Workspace } from '../../workspaces/entities/workspace.entity'
import { PricingPlan } from '../../pricing/entities/pricing-plan.entity'

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => Workspace, (w) => w.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace

  @ManyToOne(() => PricingPlan, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'plan_id' })
  plan: PricingPlan | null

  @Column({ length: 20, default: 'active' })
  status: string

  @Column({ name: 'seat_limit', default: 1 })
  seatLimit: number

  @Column({ name: 'project_limit', default: 3 })
  projectLimit: number

  @Column({ name: 'period_end', type: 'timestamptz', nullable: true })
  periodEnd: Date | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
