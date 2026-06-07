import { MigrationInterface, QueryRunner } from 'typeorm'

export class WorkspaceInvitations17504000000001 implements MigrationInterface {
  name = 'WorkspaceInvitations17504000000001'

  async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE IF NOT EXISTS workspace_invitations (
        id             UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
        workspace_id   UUID         NOT NULL,
        inviter_id     UUID         NOT NULL,
        invitee_email  VARCHAR(255) NOT NULL,
        status         VARCHAR(20)  NOT NULL DEFAULT 'pending',
        expires_at     TIMESTAMPTZ,
        created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT fk_inv_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        CONSTRAINT fk_inv_inviter   FOREIGN KEY (inviter_id)   REFERENCES users(id)       ON DELETE CASCADE
      )
    `)
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_inv_invitee_email ON workspace_invitations(invitee_email)`)
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_inv_workspace     ON workspace_invitations(workspace_id)`)
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS workspace_invitations`)
  }
}
