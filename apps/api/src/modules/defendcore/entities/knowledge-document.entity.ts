import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('defendcore_documents')
export class KnowledgeDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar' })
  title: string

  @Column({ name: 'chunk_count', type: 'int', default: 0 })
  chunkCount: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
