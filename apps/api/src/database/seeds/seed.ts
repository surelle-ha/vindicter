import 'reflect-metadata'
import { config } from 'dotenv'
import * as bcrypt from 'bcryptjs'
import { AppDataSource } from '../../data-source'
import { Role } from '../../modules/roles/entities/role.entity'
import { Access } from '../../modules/roles/entities/access.entity'
import { RoleAccess } from '../../modules/roles/entities/role-access.entity'
import { User } from '../../modules/users/entities/user.entity'
import { UserRole } from '../../modules/roles/entities/user-role.entity'

config()

// ── Default accesses ────────────────────────────────────────────────────────
const DEFAULT_ACCESSES: { resource: string; action: string; description: string }[] = [
  // users
  { resource: 'users',       action: 'create',  description: 'Create users' },
  { resource: 'users',       action: 'read',    description: 'Read users' },
  { resource: 'users',       action: 'update',  description: 'Update users' },
  { resource: 'users',       action: 'delete',  description: 'Delete users' },
  // roles
  { resource: 'roles',       action: 'create',  description: 'Create roles' },
  { resource: 'roles',       action: 'read',    description: 'Read roles' },
  { resource: 'roles',       action: 'update',  description: 'Update roles' },
  { resource: 'roles',       action: 'delete',  description: 'Delete roles' },
  // access
  { resource: 'access',      action: 'create',  description: 'Create accesses' },
  { resource: 'access',      action: 'read',    description: 'Read accesses' },
  { resource: 'access',      action: 'update',  description: 'Update accesses' },
  { resource: 'access',      action: 'delete',  description: 'Delete accesses' },
  // newsletter
  { resource: 'newsletter',  action: 'create',  description: 'Create newsletter content' },
  { resource: 'newsletter',  action: 'read',    description: 'Read newsletter content' },
  { resource: 'newsletter',  action: 'update',  description: 'Update newsletter content' },
  { resource: 'newsletter',  action: 'delete',  description: 'Delete newsletter content' },
  // beta
  { resource: 'beta',        action: 'create',  description: 'Submit beta applications' },
  { resource: 'beta',        action: 'read',    description: 'Read beta applications' },
  { resource: 'beta',        action: 'update',  description: 'Update beta application status' },
  { resource: 'beta',        action: 'delete',  description: 'Delete beta applications' },
  // support
  { resource: 'support',     action: 'create',  description: 'Submit support tickets' },
  { resource: 'support',     action: 'read',    description: 'Read support tickets' },
  { resource: 'support',     action: 'update',  description: 'Update support ticket status' },
  { resource: 'support',     action: 'delete',  description: 'Delete support tickets' },
  // api-tokens
  { resource: 'api-tokens',  action: 'create',  description: 'Create API tokens' },
  { resource: 'api-tokens',  action: 'read',    description: 'Read own API tokens' },
  { resource: 'api-tokens',  action: 'delete',  description: 'Revoke API tokens' },
  // marketing
  { resource: 'marketing',   action: 'create',  description: 'Create internal marketing records' },
  { resource: 'marketing',   action: 'read',    description: 'Read internal marketing records' },
  { resource: 'marketing',   action: 'update',  description: 'Update internal marketing records' },
  { resource: 'marketing',   action: 'delete',  description: 'Delete internal marketing records' },
  { resource: 'marketing',   action: 'send',    description: 'Send internal marketing email' },
]

// ── Default roles ────────────────────────────────────────────────────────────
const ROLES: { name: string; description: string; accessKeys: string[] }[] = [
  {
    name: 'admin',
    description: 'Full administrative access to all resources',
    accessKeys: DEFAULT_ACCESSES.map((a) => `${a.resource}.${a.action}`),
  },
  {
    name: 'member',
    description: 'Standard authenticated user',
    accessKeys: [
      'newsletter.read',
      'api-tokens.create',
      'api-tokens.read',
      'api-tokens.delete',
      'support.create',
    ],
  },
]

async function run() {
  await AppDataSource.initialize()
  console.log('✓ Database connected')

  const roleRepo       = AppDataSource.getRepository(Role)
  const accessRepo     = AppDataSource.getRepository(Access)
  const roleAccessRepo = AppDataSource.getRepository(RoleAccess)
  const userRepo       = AppDataSource.getRepository(User)
  const userRoleRepo   = AppDataSource.getRepository(UserRole)

  // ── Seed accesses ──────────────────────────────────────────────────────────
  const accessMap = new Map<string, Access>()
  for (const a of DEFAULT_ACCESSES) {
    let entity = await accessRepo.findOneBy({ resource: a.resource, action: a.action })
    if (!entity) {
      entity = accessRepo.create(a)
      await accessRepo.save(entity)
      console.log(`  + access: ${a.resource}.${a.action}`)
    }
    accessMap.set(`${a.resource}.${a.action}`, entity)
  }

  // ── Seed roles + role_access ───────────────────────────────────────────────
  const roleMap = new Map<string, Role>()
  for (const r of ROLES) {
    let role = await roleRepo.findOneBy({ name: r.name })
    if (!role) {
      role = roleRepo.create({ name: r.name, description: r.description })
      await roleRepo.save(role)
      console.log(`  + role: ${r.name}`)
    }
    roleMap.set(r.name, role)

    for (const key of r.accessKeys) {
      const access = accessMap.get(key)
      if (!access) continue
      const existing = await roleAccessRepo.findOne({
        where: { role: { id: role.id }, access: { id: access.id } },
      })
      if (!existing) {
        await roleAccessRepo.save(roleAccessRepo.create({ role, access }))
      }
    }
  }

  // ── Seed default admin user ────────────────────────────────────────────────
  const adminEmail    = process.env.SEED_ADMIN_EMAIL    ?? 'admin@vindicter.xyz'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@vindicter!2025'

  let adminUser = await userRepo.findOneBy({ email: adminEmail })
  if (!adminUser) {
    const hash = await bcrypt.hash(adminPassword, 12)
    adminUser = userRepo.create({
      email:        adminEmail,
      displayName:  'Vindicter Admin',
      passwordHash: hash,
      isActive:     true,
    })
    await userRepo.save(adminUser)
    console.log(`  + user: ${adminEmail}`)
  }

  const adminRole = roleMap.get('admin')!
  const hasAdminRole = await userRoleRepo.findOne({
    where: { user: { id: adminUser.id }, role: { id: adminRole.id } },
  })
  if (!hasAdminRole) {
    await userRoleRepo.save(userRoleRepo.create({ user: adminUser, role: adminRole }))
    console.log(`  + user_role: ${adminEmail} → admin`)
  }

  await AppDataSource.destroy()
  console.log('✓ Seed complete')
}

run().catch((e) => { console.error(e); process.exit(1) })
