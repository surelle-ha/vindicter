import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ACCESS_KEY } from '../decorators/require-access.decorator'

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<{ resource: string; action: string }>(ACCESS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ])
    if (!required) return true
    const { user } = ctx.switchToHttp().getRequest()
    const key = `${required.resource}.${required.action}`
    return user?.accesses?.includes(key) ?? false
  }
}
