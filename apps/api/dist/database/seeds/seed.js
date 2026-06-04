"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv_1 = require("dotenv");
const bcrypt = require("bcryptjs");
const data_source_1 = require("../../data-source");
const role_entity_1 = require("../../modules/roles/entities/role.entity");
const access_entity_1 = require("../../modules/roles/entities/access.entity");
const role_access_entity_1 = require("../../modules/roles/entities/role-access.entity");
const user_entity_1 = require("../../modules/users/entities/user.entity");
const user_role_entity_1 = require("../../modules/roles/entities/user-role.entity");
(0, dotenv_1.config)();
const DEFAULT_ACCESSES = [
    { resource: 'users', action: 'create', description: 'Create users' },
    { resource: 'users', action: 'read', description: 'Read users' },
    { resource: 'users', action: 'update', description: 'Update users' },
    { resource: 'users', action: 'delete', description: 'Delete users' },
    { resource: 'roles', action: 'create', description: 'Create roles' },
    { resource: 'roles', action: 'read', description: 'Read roles' },
    { resource: 'roles', action: 'update', description: 'Update roles' },
    { resource: 'roles', action: 'delete', description: 'Delete roles' },
    { resource: 'access', action: 'create', description: 'Create accesses' },
    { resource: 'access', action: 'read', description: 'Read accesses' },
    { resource: 'access', action: 'update', description: 'Update accesses' },
    { resource: 'access', action: 'delete', description: 'Delete accesses' },
    { resource: 'newsletter', action: 'create', description: 'Create newsletter content' },
    { resource: 'newsletter', action: 'read', description: 'Read newsletter content' },
    { resource: 'newsletter', action: 'update', description: 'Update newsletter content' },
    { resource: 'newsletter', action: 'delete', description: 'Delete newsletter content' },
    { resource: 'beta', action: 'create', description: 'Submit beta applications' },
    { resource: 'beta', action: 'read', description: 'Read beta applications' },
    { resource: 'beta', action: 'update', description: 'Update beta application status' },
    { resource: 'beta', action: 'delete', description: 'Delete beta applications' },
    { resource: 'support', action: 'create', description: 'Submit support tickets' },
    { resource: 'support', action: 'read', description: 'Read support tickets' },
    { resource: 'support', action: 'update', description: 'Update support ticket status' },
    { resource: 'support', action: 'delete', description: 'Delete support tickets' },
    { resource: 'api-tokens', action: 'create', description: 'Create API tokens' },
    { resource: 'api-tokens', action: 'read', description: 'Read own API tokens' },
    { resource: 'api-tokens', action: 'delete', description: 'Revoke API tokens' },
    { resource: 'marketing', action: 'create', description: 'Create internal marketing records' },
    { resource: 'marketing', action: 'read', description: 'Read internal marketing records' },
    { resource: 'marketing', action: 'update', description: 'Update internal marketing records' },
    { resource: 'marketing', action: 'delete', description: 'Delete internal marketing records' },
    { resource: 'marketing', action: 'send', description: 'Send internal marketing email' },
];
const ROLES = [
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
];
async function run() {
    await data_source_1.AppDataSource.initialize();
    console.log('✓ Database connected');
    const roleRepo = data_source_1.AppDataSource.getRepository(role_entity_1.Role);
    const accessRepo = data_source_1.AppDataSource.getRepository(access_entity_1.Access);
    const roleAccessRepo = data_source_1.AppDataSource.getRepository(role_access_entity_1.RoleAccess);
    const userRepo = data_source_1.AppDataSource.getRepository(user_entity_1.User);
    const userRoleRepo = data_source_1.AppDataSource.getRepository(user_role_entity_1.UserRole);
    const accessMap = new Map();
    for (const a of DEFAULT_ACCESSES) {
        let entity = await accessRepo.findOneBy({ resource: a.resource, action: a.action });
        if (!entity) {
            entity = accessRepo.create(a);
            await accessRepo.save(entity);
            console.log(`  + access: ${a.resource}.${a.action}`);
        }
        accessMap.set(`${a.resource}.${a.action}`, entity);
    }
    const roleMap = new Map();
    for (const r of ROLES) {
        let role = await roleRepo.findOneBy({ name: r.name });
        if (!role) {
            role = roleRepo.create({ name: r.name, description: r.description });
            await roleRepo.save(role);
            console.log(`  + role: ${r.name}`);
        }
        roleMap.set(r.name, role);
        for (const key of r.accessKeys) {
            const access = accessMap.get(key);
            if (!access)
                continue;
            const existing = await roleAccessRepo.findOne({
                where: { role: { id: role.id }, access: { id: access.id } },
            });
            if (!existing) {
                await roleAccessRepo.save(roleAccessRepo.create({ role, access }));
            }
        }
    }
    const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@vindicter.xyz';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@vindicter!2025';
    let adminUser = await userRepo.findOneBy({ email: adminEmail });
    if (!adminUser) {
        const hash = await bcrypt.hash(adminPassword, 12);
        adminUser = userRepo.create({
            email: adminEmail,
            displayName: 'Vindicter Admin',
            passwordHash: hash,
            isActive: true,
        });
        await userRepo.save(adminUser);
        console.log(`  + user: ${adminEmail}`);
    }
    const adminRole = roleMap.get('admin');
    const hasAdminRole = await userRoleRepo.findOne({
        where: { user: { id: adminUser.id }, role: { id: adminRole.id } },
    });
    if (!hasAdminRole) {
        await userRoleRepo.save(userRoleRepo.create({ user: adminUser, role: adminRole }));
        console.log(`  + user_role: ${adminEmail} → admin`);
    }
    await data_source_1.AppDataSource.destroy();
    console.log('✓ Seed complete');
}
run().catch((e) => { console.error(e); process.exit(1); });
//# sourceMappingURL=seed.js.map