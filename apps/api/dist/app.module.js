"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const database_config_1 = require("./config/database.config");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const roles_module_1 = require("./modules/roles/roles.module");
const newsletter_module_1 = require("./modules/newsletter/newsletter.module");
const beta_module_1 = require("./modules/beta/beta.module");
const support_module_1 = require("./modules/support/support.module");
const api_tokens_module_1 = require("./modules/api-tokens/api-tokens.module");
const news_module_1 = require("./modules/news/news.module");
const marketing_module_1 = require("./modules/marketing/marketing.module");
const academy_module_1 = require("./modules/academy/academy.module");
const defendcore_module_1 = require("./modules/defendcore/defendcore.module");
const cors_module_1 = require("./modules/cors/cors.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({ useFactory: database_config_1.databaseConfig }),
            throttler_1.ThrottlerModule.forRoot([
                { name: 'global', ttl: 60_000, limit: 100 },
            ]),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            newsletter_module_1.NewsletterModule,
            beta_module_1.BetaModule,
            support_module_1.SupportModule,
            api_tokens_module_1.ApiTokensModule,
            news_module_1.NewsModule,
            marketing_module_1.MarketingModule,
            academy_module_1.AcademyModule,
            defendcore_module_1.DefendCoreModule,
            cors_module_1.CorsModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map