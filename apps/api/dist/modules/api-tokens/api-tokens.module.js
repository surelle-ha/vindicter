"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiTokensModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const api_token_entity_1 = require("./entities/api-token.entity");
const api_tokens_controller_1 = require("./api-tokens.controller");
const api_tokens_service_1 = require("./api-tokens.service");
let ApiTokensModule = class ApiTokensModule {
};
exports.ApiTokensModule = ApiTokensModule;
exports.ApiTokensModule = ApiTokensModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([api_token_entity_1.ApiToken])],
        controllers: [api_tokens_controller_1.ApiTokensController],
        providers: [api_tokens_service_1.ApiTokensService],
    })
], ApiTokensModule);
//# sourceMappingURL=api-tokens.module.js.map