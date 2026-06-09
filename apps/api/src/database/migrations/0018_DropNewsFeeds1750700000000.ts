import { MigrationInterface, QueryRunner } from 'typeorm'

export class DropNewsFeeds1750700000000 implements MigrationInterface {
  name = 'DropNewsFeeds1750700000000'

  async up(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS "rss_articles" CASCADE`)
    await qr.query(`DROP TABLE IF EXISTS "rss_feeds" CASCADE`)
    await qr.query(`DROP TABLE IF EXISTS "newsletter_updates" CASCADE`)
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE IF NOT EXISTS "newsletter_updates" (
        "id"           UUID         NOT NULL DEFAULT uuid_generate_v4(),
        "title"        VARCHAR(255) NOT NULL,
        "summary"      TEXT,
        "body"         TEXT         NOT NULL,
        "status"       VARCHAR(20)  NOT NULL DEFAULT 'draft',
        "published_at" TIMESTAMPTZ,
        "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "pk_newsletter_updates" PRIMARY KEY ("id")
      )
    `)
    await qr.query(`
      CREATE TABLE IF NOT EXISTS "rss_feeds" (
        "id"         UUID         NOT NULL DEFAULT uuid_generate_v4(),
        "name"       VARCHAR      NOT NULL,
        "url"        VARCHAR      NOT NULL,
        "category"   VARCHAR      NOT NULL DEFAULT 'general',
        "enabled"    BOOLEAN      NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "pk_rss_feeds"  PRIMARY KEY ("id"),
        CONSTRAINT "uq_rss_feeds_url" UNIQUE ("url")
      )
    `)
    await qr.query(`
      CREATE TABLE IF NOT EXISTS "rss_articles" (
        "id"           UUID         NOT NULL DEFAULT uuid_generate_v4(),
        "feed_id"      UUID         NOT NULL,
        "feed_name"    VARCHAR      NOT NULL,
        "title"        VARCHAR      NOT NULL,
        "link"         VARCHAR      NOT NULL,
        "summary"      TEXT,
        "published_at" TIMESTAMPTZ,
        "fetched_at"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "pk_rss_articles"   PRIMARY KEY ("id"),
        CONSTRAINT "uq_rss_articles_link" UNIQUE ("link"),
        CONSTRAINT "fk_rss_articles_feed" FOREIGN KEY ("feed_id") REFERENCES "rss_feeds" ("id") ON DELETE CASCADE
      )
    `)
  }
}
