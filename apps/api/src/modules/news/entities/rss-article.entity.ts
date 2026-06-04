import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { RssFeed } from './rss-feed.entity'

@Entity('rss_articles')
export class RssArticle {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => RssFeed, feed => feed.articles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'feed_id' })
  feed: RssFeed

  @Column({ name: 'feed_id' })
  feedId: string

  @Column({ name: 'feed_name' })
  feedName: string

  @Column()
  title: string

  @Column({ unique: true })
  link: string

  @Column({ nullable: true, type: 'text' })
  summary: string | null

  @Column({ name: 'published_at', nullable: true, type: 'timestamptz' })
  publishedAt: Date | null

  @CreateDateColumn({ name: 'fetched_at' })
  fetchedAt: Date
}
