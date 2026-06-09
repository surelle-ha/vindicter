"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
const user_entity_1 = require("../modules/users/entities/user.entity");
const role_entity_1 = require("../modules/roles/entities/role.entity");
const access_entity_1 = require("../modules/roles/entities/access.entity");
const role_access_entity_1 = require("../modules/roles/entities/role-access.entity");
const user_role_entity_1 = require("../modules/roles/entities/user-role.entity");
const newsletter_signup_entity_1 = require("../modules/newsletter/entities/newsletter-signup.entity");
const special_beta_application_entity_1 = require("../modules/beta/entities/special-beta-application.entity");
const support_ticket_entity_1 = require("../modules/support/entities/support-ticket.entity");
const marketing_segment_entity_1 = require("../modules/marketing/entities/marketing-segment.entity");
const marketing_contact_entity_1 = require("../modules/marketing/entities/marketing-contact.entity");
const marketing_campaign_entity_1 = require("../modules/marketing/entities/marketing-campaign.entity");
const marketing_template_entity_1 = require("../modules/marketing/entities/marketing-template.entity");
const marketing_send_event_entity_1 = require("../modules/marketing/entities/marketing-send-event.entity");
const cors_origin_entity_1 = require("../modules/cors/entities/cors-origin.entity");
const pricing_plan_entity_1 = require("../modules/pricing/entities/pricing-plan.entity");
const workspace_entity_1 = require("../modules/workspaces/entities/workspace.entity");
const workspace_member_entity_1 = require("../modules/workspaces/entities/workspace-member.entity");
const workspace_invitation_entity_1 = require("../modules/workspaces/entities/workspace-invitation.entity");
const subscription_entity_1 = require("../modules/subscriptions/entities/subscription.entity");
const databaseConfig = () => {
    const url = process.env.DATABASE_URL ?? '';
    if (!url.startsWith('postgres://') && !url.startsWith('postgresql://')) {
        throw new Error('DATABASE_URL must be a PostgreSQL connection string (postgres:// or postgresql://). ' +
            'Only PostgreSQL is supported.');
    }
    return {
        type: 'postgres',
        url,
        entities: [
            user_entity_1.User, role_entity_1.Role, access_entity_1.Access, role_access_entity_1.RoleAccess, user_role_entity_1.UserRole,
            newsletter_signup_entity_1.NewsletterSignup,
            special_beta_application_entity_1.SpecialBetaApplication, support_ticket_entity_1.SupportTicket,
            marketing_segment_entity_1.MarketingSegment, marketing_contact_entity_1.MarketingContact, marketing_campaign_entity_1.MarketingCampaign,
            marketing_template_entity_1.MarketingTemplate, marketing_send_event_entity_1.MarketingSendEvent,
            cors_origin_entity_1.CorsOrigin,
            pricing_plan_entity_1.PricingPlan, workspace_entity_1.Workspace, workspace_member_entity_1.WorkspaceMember, workspace_invitation_entity_1.WorkspaceInvitation, subscription_entity_1.Subscription,
        ],
        migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
        synchronize: false,
        logging: process.env.NODE_ENV === 'development',
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };
};
exports.databaseConfig = databaseConfig;
//# sourceMappingURL=database.config.js.map