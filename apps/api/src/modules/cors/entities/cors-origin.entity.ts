import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('cors_origins')
export class CorsOrigin {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', unique: true })
  origin: string

  @Column({ type: 'varchar', default: '' })
  label: string

  @Column({ type: 'boolean', default: true })
  enabled: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
