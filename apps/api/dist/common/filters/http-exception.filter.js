"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    constructor() {
        this.log = new common_1.Logger(GlobalExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const req = ctx.getRequest();
        const res = ctx.getResponse();
        const isHttp = exception instanceof common_1.HttpException;
        const status = isHttp ? exception.getStatus() : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const rawResp = isHttp ? exception.getResponse() : null;
        const code = isHttp
            ? (typeof rawResp === 'object' && rawResp !== null && 'error' in rawResp
                ? String(rawResp.error)
                : common_1.HttpStatus[status] ?? 'HTTP_ERROR')
            : 'INTERNAL_SERVER_ERROR';
        const message = isHttp
            ? (typeof rawResp === 'string'
                ? rawResp
                : typeof rawResp === 'object' && rawResp !== null && 'message' in rawResp
                    ? (Array.isArray(rawResp.message)
                        ? rawResp.message.join('; ')
                        : String(rawResp.message))
                    : 'An error occurred')
            : 'Internal server error';
        if (status >= 500) {
            this.log.error(`[${req.method}] ${req.url} → ${status}`, exception instanceof Error ? exception.stack : String(exception));
        }
        const body = {
            success: false,
            error: { code, message },
            meta: {
                requestId: req.headers?.['x-request-id'] || (0, crypto_1.randomUUID)(),
                timestamp: new Date().toISOString(),
                version: 'v1',
                path: req.url ?? '',
                method: req.method ?? '',
            },
        };
        if (typeof res.code === 'function') {
            res.code(status).send(body);
        }
        else {
            res.status(status).json(body);
        }
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map