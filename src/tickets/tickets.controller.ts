import {
  Body,
  ConflictException,
  Controller,
  Get,
  Inject,
  Post,
} from '@nestjs/common';
import { Company } from '../../db/models/Company';
import {
  Ticket,
  TicketCategory,
  TicketStatus,
  TicketType,
} from '../../db/models/Ticket';
import { User, UserRole } from '../../db/models/User';
import { Sequelize } from 'sequelize-typescript';
import { NewTicketInput } from './ticket.schema';

interface TicketDto {
  id: number;
  type: TicketType;
  companyId: number;
  assigneeId: number;
  status: TicketStatus;
  category: TicketCategory;
}

@Controller('api/v1/tickets')
export class TicketsController {
  constructor(@Inject('SEQUELIZE') private readonly sequelize: Sequelize) {}

  @Get()
  async findAll() {
    return await Ticket.findAll({ include: [Company, User] });
  }

  @Post()
  async create(@Body() newTicketDto: NewTicketInput) {
    const { type, companyId } = newTicketDto;

    // Check for duplicate registrationAddressChange tickets
    if (type === TicketType.registrationAddressChange) {
      const existingTicket = await Ticket.findOne({
        where: {
          companyId,
          type: TicketType.registrationAddressChange,
          status: TicketStatus.open,
        },
      });

      if (existingTicket) {
        throw new ConflictException(
          'Company already has an open registrationAddressChange ticket',
        );
      }
    }

    let category: TicketCategory | undefined;
    let userRole: UserRole | undefined;

    // Determine category and user role based on ticket type
    if (type === TicketType.managementReport) {
      category = TicketCategory.accounting;
      userRole = UserRole.accountant;
    } else if (type === TicketType.registrationAddressChange) {
      category = TicketCategory.corporate;
      userRole = UserRole.corporateSecretary;
    } else if (type === TicketType.strikeOff) {
      category = TicketCategory.management;
      userRole = UserRole.director;
    }

    if (!category || !userRole) {
      throw new ConflictException('Invalid ticket type');
    }

    let assignees = await User.findAll({
      where: { companyId, role: userRole },
      order: [['createdAt', 'DESC']],
    });

    // If no corporate secretary found for registrationAddressChange, try to find a director
    if (type === TicketType.registrationAddressChange && !assignees.length) {
      userRole = UserRole.director;
      assignees = await User.findAll({
        where: { companyId, role: userRole },
      });
    }

    if (!assignees.length) {
      throw new ConflictException(
        `Cannot find user with role ${userRole} to create a ticket`,
      );
    }

    // Check for multiple users with the same role (except for accountants)
    if (
      [UserRole.corporateSecretary, UserRole.director].includes(userRole) &&
      assignees.length > 1
    ) {
      throw new ConflictException(
        `Multiple users with role ${userRole}. Cannot create a ticket`,
      );
    }

    const assignee = assignees[0];

    const result = await this.sequelize.transaction(async (t) => {
      // For strikeOff tickets, resolve all other active tickets for this company
      if (type === TicketType.strikeOff) {
        await Ticket.update(
          { status: TicketStatus.resolved },
          {
            where: {
              companyId,
              status: TicketStatus.open,
            },
            transaction: t,
          },
        );
      }
      const ticket = await Ticket.create(
        {
          companyId,
          assigneeId: assignee.id,
          category,
          type,
          status: TicketStatus.open,
        },
        { transaction: t },
      );

      return ticket;
    });

    const ticketDto: TicketDto = {
      id: result.id,
      type: result.type,
      assigneeId: result.assigneeId,
      status: result.status,
      category: result.category,
      companyId: result.companyId,
    };

    return ticketDto;
  }
}
