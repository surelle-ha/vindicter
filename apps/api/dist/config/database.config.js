"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
const user_entity_1 = require("../modules/users/entities/user.entity");
const role_entity_1 = require("../modules/roles/entities/role.entity");
const access_entity_1 = require("../modules/roles/entities/access.entity");
const role_access_entity_1 = require("../modules/roles/entities/role-access.entity");
const user_role_entity_1 = require("../modules/roles/entities/user-role.entity");
const newsletter_signup_entity_1 = require("../modules/newsletter/entities/newsletter-signup.entity");
const newsletter_update_entity_1 = require("../modules/newsletter/entities/newsletter-update.entity");
const special_beta_application_entity_1 = require("../modules/beta/entities/special-beta-application.entity");
const support_ticket_entity_1 = require("../modules/support/entities/support-ticket.entity");
const api_token_entity_1 = require("../modules/api-tokens/entities/api-token.entity");
const rss_feed_entity_1 = require("../modules/news/entities/rss-feed.entity");
const rss_article_entity_1 = require("../modules/news/entities/rss-article.entity");
const marketing_segment_entity_1 = require("../modules/marketing/entities/marketing-segment.entity");
const marketing_contact_entity_1 = require("../modules/marketing/entities/marketing-contact.entity");
const marketing_campaign_entity_1 = require("../modules/marketing/entities/marketing-campaign.entity");
const marketing_template_entity_1 = require("../modules/marketing/entities/marketing-template.entity");
const marketing_send_event_entity_1 = require("../modules/marketing/entities/marketing-send-event.entity");
const academy_progress_entity_1 = require("../modules/academy/entities/academy-progress.entity");
const academy_chat_session_entity_1 = require("../modules/academy/entities/academy-chat-session.entity");
const defendcore_config_entity_1 = require("../modules/defendcore/entities/defendcore-config.entity");
const knowledge_document_entity_1 = require("../modules/defendcore/entities/knowledge-document.entity");
const cors_origin_entity_1 = require("../modules/cors/entities/cors-origin.entity");
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
            newsletter_signup_entity_1.NewsletterSignup, newsletter_update_entity_1.NewsletterUpdate,
            special_beta_application_entity_1.SpecialBetaApplication, support_ticket_entity_1.SupportTicket, api_token_entity_1.ApiToken,
            rss_feed_entity_1.RssFeed, rss_article_entity_1.RssArticle,
            marketing_segment_entity_1.MarketingSegment, marketing_contact_entity_1.MarketingContact, marketing_campaign_entity_1.MarketingCampaign,
            marketing_template_entity_1.MarketingTemplate, marketing_send_event_entity_1.MarketingSendEvent,
            academy_progress_entity_1.AcademyProgress, academy_chat_session_entity_1.AcademyChatSession,
            defendcore_config_entity_1.DefendCoreConfig, knowledge_document_entity_1.KnowledgeDocument, cors_origin_entity_1.CorsOrigin,
        ],
        migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
        synchronize: false,
        logging: process.env.NODE_ENV === 'development',
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };
};
exports.databaseConfig = databaseConfig;
//# sourceMappingURL=database.config.js.map