import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity('defendcore_config')
export class DefendCoreConfig {
  @PrimaryColumn({ type: 'varchar', default: 'default' })
  id: string

  @Column({ name: 'desktop_enabled', type: 'boolean', default: false })
  desktopEnabled: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
