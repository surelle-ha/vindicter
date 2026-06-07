import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Workspace } from './entities/workspace.entity'
import { WorkspaceMember } from './entities/workspace-member.entity'
import { WorkspaceInvitation } from './entities/workspace-invitation.entity'
import { User } from '../users/entities/user.entity'
import { Subscription } from '../subscriptions/entities/subscription.entity'
import { PricingPlan } from '../pricing/entities/pricing-plan.entity'

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)           private wsRepo:     Repository<Workspace>,
    @InjectRepository(WorkspaceMember)     private memRepo:    Repository<WorkspaceMember>,
    @InjectRepository(WorkspaceInvitation) private invRepo:    Repository<WorkspaceInvitation>,
    @InjectRepository(User)                private userRepo:   Repository<User>,
    @InjectRepository(Subscription)        private subRepo:    Repository<Subscription>,
    @InjectRepository(PricingPlan)         private planRepo:   Repository<PricingPlan>,
  ) {}

  async findAllForUser(userId: string) {
    const memberships = await this.memRepo.find({
      where: { user: { id: userId } },
      relations: {
        workspace: {
          subscriptions: { plan: true },
          members: { user: true },
        },
      },
    })
    return memberships.map(m => ({
      id:         m.workspace.id,
      name:       m.workspace.name,
      ownerId:    m.workspace.ownerId,
      memberRole: m.memberRole,
      joinedAt:   m.joinedAt,
      members:    m.workspace.members ?? [],
      subscription: m.workspace.subscriptions?.[0] ?? null,
    }))
  }

  async findAllAdmin() {
    const workspaces = await this.wsRepo.find({
      relations: {
        members: { user: true },
        subscriptions: { plan: true },
      },
      order: { createdAt: 'DESC' },
    })
    return workspaces.map(ws => ({
      id:          ws.id,
      name:        ws.name,
      ownerId:     ws.ownerId,
      createdAt:   ws.createdAt,
      memberCount: ws.members?.length ?? 0,
      members:     ws.members ?? [],
      subscription: ws.subscriptions?.[0] ?? null,
    }))
  }

  async adminChangePlan(workspaceId: string, planId: string) {
    const plan = await this.planRepo.findOneBy({ id: planId })
    if (!plan) throw new NotFoundException('Plan not found')

    const sub = await this.subRepo.findOne({
      where: { workspace: { id: workspaceId } },
      order: { createdAt: 'DESC' },
    })
    if (!sub) throw new NotFoundException('No subscription found for this workspace')

    sub.plan         = plan
    sub.seatLimit    = plan.seatLimit
    sub.projectLimit = plan.projectLimit
    return this.subRepo.save(sub)
  }

  async create(userId: string, name: string) {
    const user = await this.userRepo.findOneBy({ id: userId })
    if (!user) throw new NotFoundException('User not found')

    const workspace = await this.wsRepo.save(this.wsRepo.create({ name, ownerId: userId }))
    await this.memRepo.save(this.memRepo.create({ workspace, user, memberRole: 'owner' }))

    const freePlan = await this.planRepo.findOneBy({ name: 'Free' })
    await this.subRepo.save(this.subRepo.create({
      workspace,
      plan:         freePlan ?? null,
      status:       'active',
      seatLimit:    freePlan?.seatLimit    ?? 1,
      projectLimit: freePlan?.projectLimit ?? 3,
    }))

    return this.findOne(workspace.id, userId)
  }

  async findOne(workspaceId: string, userId: string) {
    const member = await this.memRepo.findOne({
      where: { workspace: { id: workspaceId }, user: { id: userId } },
    })
    if (!member) throw new ForbiddenException('Not a member of this workspace')

    const ws = await this.wsRepo.findOne({
      where: { id: workspaceId },
      relations: {
        members: { user: true },
        subscriptions: { plan: true },
      },
    })
    if (!ws) throw new NotFoundException('Workspace not found')
    return ws
  }

  // ── Invitations ─────────────────────────────────────────────────────────────

  async sendInvitation(workspaceId: string, inviterId: string, email: string) {
    const requester = await this.memRepo.findOne({
      where: { workspace: { id: workspaceId }, user: { id: inviterId } },
    })
    if (!requester || !['owner', 'admin'].includes(requester.memberRole)) {
      throw new ForbiddenException('Only owners and admins can invite members')
    }

    const sub = await this.subRepo.findOne({
      where: { workspace: { id: workspaceId } },
      order: { createdAt: 'DESC' },
    })
    const currentCount = await this.memRepo.count({ where: { workspace: { id: workspaceId } } })
    if (sub && sub.seatLimit !== -1 && currentCount >= sub.seatLimit) {
      throw new BadRequestException(`Seat limit reached (${sub.seatLimit}). Upgrade your plan to add more members.`)
    }

    const existing = await this.memRepo.findOne({
      where: { workspace: { id: workspaceId }, user: { email: email.toLowerCase() } as any },
    })
    if (existing) throw new BadRequestException('User is already a member of this workspace')

    const pending = await this.invRepo.findOne({
      where: { workspace: { id: workspaceId }, inviteeEmail: email.toLowerCase(), status: 'pending' },
    })
    if (pending) throw new BadRequestException('An invitation is already pending for this email')

    const ws = await this.wsRepo.findOneBy({ id: workspaceId })
    if (!ws) throw new NotFoundException('Workspace not found')

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    const inv = await this.invRepo.save(this.invRepo.create({
      workspace: ws,
      inviterId,
      inviteeEmail: email.toLowerCase(),
      status: 'pending',
      expiresAt,
    }))
    return { id: inv.id, inviteeEmail: inv.inviteeEmail, expiresAt: inv.expiresAt, workspaceName: ws.name }
  }

  async getMyInvitations(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId })
    if (!user) return []

    const invitations = await this.invRepo.find({
      where: { inviteeEmail: user.email, status: 'pending' },
      relations: { workspace: true },
      order: { createdAt: 'DESC' },
    })

    return Promise.all(invitations.map(async inv => {
      const inviter = await this.userRepo.findOneBy({ id: inv.inviterId })
      const parts = [inviter?.firstName, inviter?.lastName].filter(Boolean)
      return {
        id: inv.id,
        workspace: { id: inv.workspace.id, name: inv.workspace.name },
        inviterName: parts.length ? parts.join(' ') : (inviter?.email ?? 'Unknown'),
        inviteeEmail: inv.inviteeEmail,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
      }
    }))
  }

  async respondToInvitation(invitationId: string, userId: string, action: 'accept' | 'decline') {
    const user = await this.userRepo.findOneBy({ id: userId })
    if (!user) throw new NotFoundException('User not found')

    const inv = await this.invRepo.findOne({
      where: { id: invitationId, status: 'pending' },
      relations: { workspace: true },
    })
    if (!inv) throw new NotFoundException('Invitation not found or already responded')
    if (inv.inviteeEmail !== user.email) throw new ForbiddenException('This invitation is not for you')
    if (inv.expiresAt && inv.expiresAt < new Date()) {
      throw new BadRequestException('This invitation has expired')
    }

    if (action === 'accept') {
      const alreadyMember = await this.memRepo.findOne({
        where: { workspace: { id: inv.workspace.id }, user: { id: userId } },
      })
      if (!alreadyMember) {
        await this.memRepo.save(this.memRepo.create({
          workspace: inv.workspace,
          user,
          memberRole: 'member',
        }))
      }
    }

    inv.status = action === 'accept' ? 'accepted' : 'declined'
    await this.invRepo.save(inv)
    return { status: inv.status }
  }

  // ── Members ──────────────────────────────────────────────────────────────────

  async removeMember(workspaceId: string, requesterId: string, targetUserId: string) {
    const requester = await this.memRepo.findOne({
      where: { workspace: { id: workspaceId }, user: { id: requesterId } },
    })
    if (!requester || !['owner', 'admin'].includes(requester.memberRole)) {
      throw new ForbiddenException('Only owners and admins can remove members')
    }
    if (targetUserId === requesterId) throw new BadRequestException('Cannot remove yourself')
    await this.memRepo.delete({ workspace: { id: workspaceId }, user: { id: targetUserId } })
  }

  async rename(workspaceId: string, userId: string, name: string) {
    const member = await this.memRepo.findOne({
      where: { workspace: { id: workspaceId }, user: { id: userId } },
    })
    if (!member || !['owner', 'admin'].includes(member.memberRole)) {
      throw new ForbiddenException('Only owners and admins can rename workspaces')
    }
    await this.wsRepo.update(workspaceId, { name })
    return this.findOne(workspaceId, userId)
  }

  async delete(workspaceId: string, userId: string) {
    const member = await this.memRepo.findOne({
      where: { workspace: { id: workspaceId }, user: { id: userId } },
    })
    if (!member || member.memberRole !== 'owner') {
      throw new ForbiddenException('Only the owner can delete a workspace')
    }
    await this.wsRepo.delete(workspaceId)
  }

  async getSubscription(workspaceId: string, userId: string) {
    await this.findOne(workspaceId, userId)
    return this.subRepo.findOne({
      where: { workspace: { id: workspaceId } },
      relations: { plan: true },
      order: { createdAt: 'DESC' },
    })
  }
}
