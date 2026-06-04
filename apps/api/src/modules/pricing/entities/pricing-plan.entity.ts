import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('pricing_plans')
export class PricingPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  name: string

  @Column({ nullable: true, type: 'text' })
  description: string | null

  @Column({ name: 'token_limit', default: 0 })
  tokenLimit: number

  @Column({ name: 'price_usd', type: 'numeric', precision: 8, scale: 2, default: 0 })
  priceUsd: number

  @Column({ name: 'is_active', default: true })
  isActive: boolean

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
