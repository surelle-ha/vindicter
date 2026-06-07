import { MigrationInterface, QueryRunner } from 'typeorm'

export class WorkspaceSubscription17503000000001 implements MigrationInterface {
  name = 'WorkspaceSubscription17503000000001'

  async up(qr: QueryRunner): Promise<void> {
    // Recreate pricing_plans with seat/project limits
    await qr.query(`
      CREATE TABLE IF NOT EXISTS pricing_plans (
        id            UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
        name          VARCHAR(100)  NOT NULL UNIQUE,
        description   TEXT,
        token_limit   INTEGER       NOT NULL DEFAULT 0,
        seat_limit    INTEGER       NOT NULL DEFAULT 1,
        project_limit INTEGER       NOT NULL DEFAULT 3,
        price_usd     NUMERIC(8,2)  NOT NULL DEFAULT 0,
        is_active     BOOLEAN       NOT NULL DEFAULT true,
        sort_order    INTEGER       NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
        updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
      )
    `)

    // Seed default plans
    await qr.query(`
      INSERT INTO pricing_plans (name, description, token_limit, seat_limit, project_limit, price_usd, is_active, sort_order)
      VALUES
        ('Free',       'Get started — free forever',             0,       1,  3,  0.00, true, 0),
        ('Pro',        'For growing teams',                      0,       5,  20, 12.00, true, 1),
        ('Enterprise', 'Unlimited seats and projects',           0,      -1,  -1, 49.00, true, 2)
      ON CONFLICT (name) DO NOTHING
    `)

    // Workspaces
    await qr.query(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id         UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
        name       VARCHAR(120) NOT NULL,
        owner_id   UUID,
        created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT fk_workspace_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `)

    // Workspace members
    await qr.query(`
      CREATE TABLE IF NOT EXISTS workspace_members (
        id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
        workspace_id UUID        NOT NULL,
        user_id      UUID        NOT NULL,
        member_role  VARCHAR(20) NOT NULL DEFAULT 'member',
        joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT fk_wm_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        CONSTRAINT fk_wm_user      FOREIGN KEY (user_id)      REFERENCES users(id)       ON DELETE CASCADE,
        CONSTRAINT uq_wm           UNIQUE (workspace_id, user_id)
      )
    `)

    // Subscriptions
    await qr.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
        workspace_id  UUID        NOT NULL,
        plan_id       UUID,
        status        VARCHAR(20) NOT NULL DEFAULT 'active',
        seat_limit    INTEGER     NOT NULL DEFAULT 1,
        project_limit INTEGER     NOT NULL DEFAULT 3,
        period_end    TIMESTAMPTZ,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT fk_sub_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id)  ON DELETE CASCADE,
        CONSTRAINT fk_sub_plan      FOREIGN KEY (plan_id)      REFERENCES pricing_plans(id) ON DELETE SET NULL
      )
    `)

    // Backfill: create a personal workspace + Free subscription for every existing user
    await qr.query(`
      WITH free_plan AS (
        SELECT id FROM pricing_plans WHERE name = 'Free' LIMIT 1
      ),
      new_workspaces AS (
        INSERT INTO workspaces (name, owner_id)
        SELECT COALESCE(NULLIF(CONCAT(first_name, ' ', last_name), ' '), email) || '''s Workspace', id
        FROM users
        RETURNING id, owner_id
      ),
      new_members AS (
        INSERT INTO workspace_members (workspace_id, user_id, member_role)
        SELECT nw.id, nw.owner_id, 'owner'
        FROM new_workspaces nw
        WHERE nw.owner_id IS NOT NULL
        RETURNING workspace_id
      )
      INSERT INTO subscriptions (workspace_id, plan_id, status, seat_limit, project_limit)
      SELECT nm.workspace_id, (SELECT id FROM free_plan), 'active', 1, 3
      FROM new_members nm
    `)
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS subscriptions CASCADE`)
    await qr.query(`DROP TABLE IF EXISTS workspace_members CASCADE`)
    await qr.query(`DROP TABLE IF EXISTS workspaces CASCADE`)
    await qr.query(`DROP TABLE IF EXISTS pricing_plans CASCADE`)
  }
}
