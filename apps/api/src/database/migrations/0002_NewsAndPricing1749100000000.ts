import { MigrationInterface, QueryRunner } from 'typeorm'

export class NewsAndPricing1749100000000 implements MigrationInterface {
  name = 'NewsAndPricing1749100000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "rss_feeds" (
        "id"         UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
        "name"       VARCHAR(100) NOT NULL,
        "url"        TEXT         NOT NULL UNIQUE,
        "category"   VARCHAR(50)  NOT NULL DEFAULT 'general',
        "enabled"    BOOLEAN      NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ  NOT NULL DEFAULT now()
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "rss_articles" (
        "id"           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
        "feed_id"      UUID        NOT NULL REFERENCES "rss_feeds"("id") ON DELETE CASCADE,
        "feed_name"    VARCHAR(100) NOT NULL,
        "title"        TEXT        NOT NULL,
        "link"         TEXT        NOT NULL UNIQUE,
        "summary"      TEXT,
        "published_at" TIMESTAMPTZ,
        "fetched_at"   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)

    await queryRunner.query(`CREATE INDEX "idx_rss_articles_published" ON "rss_articles" ("published_at" DESC)`)
    await queryRunner.query(`CREATE INDEX "idx_rss_articles_feed"      ON "rss_articles" ("feed_id", "published_at" DESC)`)

    await queryRunner.query(`
      CREATE TABLE "pricing_plans" (
        "id"          UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
        "name"        VARCHAR(100)   NOT NULL UNIQUE,
        "description" TEXT,
        "token_limit" INTEGER        NOT NULL DEFAULT 0,
        "price_usd"   NUMERIC(8,2)   NOT NULL DEFAULT 0,
        "is_active"   BOOLEAN        NOT NULL DEFAULT true,
        "sort_order"  INTEGER        NOT NULL DEFAULT 0,
        "created_at"  TIMESTAMPTZ    NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ    NOT NULL DEFAULT now()
      )
    `)

    await queryRunner.query(`
      INSERT INTO "rss_feeds" ("name", "url", "category") VALUES
        ('CS Hub — Attacks',  'https://www.cshub.com/rss/categories/attacks', 'attacks'),
        ('CS Hub — Articles', 'https://www.cshub.com/rss/articles',            'articles'),
        ('CS Hub — Reports',  'https://www.cshub.com/rss/reports',             'reports')
      ON CONFLICT ("url") DO NOTHING
    `)

    await queryRunner.query(`
      INSERT INTO "pricing_plans" ("name", "description", "token_limit", "price_usd", "sort_order") VALUES
        ('Free',       'Basic access for individual users',           50000,    0.00, 1),
        ('Basic',      'For individuals and small teams',            250000,    9.00, 2),
        ('Pro',        'For professional security engineers',       1000000,   29.00, 3),
        ('Enterprise', 'Unlimited usage for large organizations', 10000000,   99.00, 4)
      ON CONFLICT ("name") DO NOTHING
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "rss_articles"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "rss_feeds"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "pricing_plans"`)
  }
}
