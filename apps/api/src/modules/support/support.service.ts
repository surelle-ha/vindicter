import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { SupportTicket, TicketStatus } from './entities/support-ticket.entity'

@Injectable()
export class SupportService {
  constructor(@InjectRepository(SupportTicket) private repo: Repository<SupportTicket>) {}

  create(data: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>) {
    return this.repo.save(this.repo.create({ ...data, status: 'open' }))
  }

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } })
  }

  async updateStatus(id: string, status: TicketStatus) {
    const ticket = await this.repo.findOneBy({ id })
    if (!ticket) throw new NotFoundException('Ticket not found')
    ticket.status = status
    return this.repo.save(ticket)
  }

  async remove(id: string) {
    const ticket = await this.repo.findOneBy({ id })
    if (!ticket) throw new NotFoundException('Ticket not found')
    await this.repo.remove(ticket)
  }
}
