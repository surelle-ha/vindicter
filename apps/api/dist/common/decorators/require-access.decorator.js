"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireAccess = exports.ACCESS_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.ACCESS_KEY = 'access';
const RequireAccess = (resource, action) => (0, common_1.SetMetadata)(exports.ACCESS_KEY, { resource, action });
exports.RequireAccess = RequireAccess;
//# sourceMappingURL=require-access.decorator.js.map