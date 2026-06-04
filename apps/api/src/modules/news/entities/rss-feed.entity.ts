import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { RssArticle } from './rss-article.entity'

@Entity('rss_feeds')
export class RssFeed {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ unique: true })
  url: string

  @Column({ default: 'general' })
  category: string

  @Column({ default: true })
  enabled: boolean

  @OneToMany(() => RssArticle, article => article.feed)
  articles: RssArticle[]

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
