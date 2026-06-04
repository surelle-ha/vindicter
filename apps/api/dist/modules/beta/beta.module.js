"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetaModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const special_beta_application_entity_1 = require("./entities/special-beta-application.entity");
const beta_controller_1 = require("./beta.controller");
const beta_service_1 = require("./beta.service");
let BetaModule = class BetaModule {
};
exports.BetaModule = BetaModule;
exports.BetaModule = BetaModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([special_beta_application_entity_1.SpecialBetaApplication])],
        controllers: [beta_controller_1.BetaController],
        providers: [beta_service_1.BetaService],
    })
], BetaModule);
//# sourceMappingURL=beta.module.js.map