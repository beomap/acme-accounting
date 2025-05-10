import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Company } from '../../db/models/Company';
import {
  Ticket,
  TicketCategory,
  TicketStatus,
  TicketType,
} from '../../db/models/Ticket';
import { User, UserRole } from '../../db/models/User';
import { DbModule } from '../db.module';
import { TicketsController } from './tickets.controller';
import { Sequelize } from 'sequelize-typescript';
import { AppConfigModule } from '../config/config.module';

describe('TicketsController', () => {
  let controller: TicketsController;
  let sequelize: Sequelize;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      imports: [DbModule, AppConfigModule],
    }).compile();

    controller = module.get<TicketsController>(TicketsController);
    sequelize = module.get<Sequelize>('SEQUELIZE');
  });

  it('should be defined', async () => {
    expect(controller).toBeDefined();

    const res = await controller.findAll();
    console.log(res);
  });

  describe('create', () => {
    describe('managementReport', () => {
      it('creates managementReport ticket', async () => {
        const company = await Company.create({ name: 'test' });
        const user = await User.create({
          name: 'Test User',
          role: UserRole.accountant,
          companyId: company.id,
        });

        const ticket = await controller.create({
          companyId: company.id,
          type: TicketType.managementReport,
        });

        expect(ticket.category).toBe(TicketCategory.accounting);
        expect(ticket.assigneeId).toBe(user.id);
        expect(ticket.status).toBe(TicketStatus.open);
      });

      it('if there are multiple accountants, assign the last one', async () => {
        const company = await Company.create({ name: 'test' });
        await User.create({
          name: 'Test User',
          role: UserRole.accountant,
          companyId: company.id,
        });
        const user2 = await User.create({
          name: 'Test User',
          role: UserRole.accountant,
          companyId: company.id,
        });

        const ticket = await controller.create({
          companyId: company.id,
          type: TicketType.managementReport,
        });

        expect(ticket.category).toBe(TicketCategory.accounting);
        expect(ticket.assigneeId).toBe(user2.id);
        expect(ticket.status).toBe(TicketStatus.open);
      });

      it('if there is no accountant, throw', async () => {
        const company = await Company.create({ name: 'test' });

        await expect(
          controller.create({
            companyId: company.id,
            type: TicketType.managementReport,
          }),
        ).rejects.toEqual(
          new ConflictException(
            `Cannot find user with role accountant to create a ticket`,
          ),
        );
      });
    });

    describe('registrationAddressChange', () => {
      it('creates registrationAddressChange ticket', async () => {
        const company = await Company.create({ name: 'test' });
        const user = await User.create({
          name: 'Test User',
          role: UserRole.corporateSecretary,
          companyId: company.id,
        });

        const ticket = await controller.create({
          companyId: company.id,
          type: TicketType.registrationAddressChange,
        });

        expect(ticket.category).toBe(TicketCategory.corporate);
        expect(ticket.assigneeId).toBe(user.id);
        expect(ticket.status).toBe(TicketStatus.open);
      });

      it('if there are multiple secretaries, throw', async () => {
        const company = await Company.create({ name: 'test' });
        await User.create({
          name: 'Test User',
          role: UserRole.corporateSecretary,
          companyId: company.id,
        });
        await User.create({
          name: 'Test User',
          role: UserRole.corporateSecretary,
          companyId: company.id,
        });

        await expect(
          controller.create({
            companyId: company.id,
            type: TicketType.registrationAddressChange,
          }),
        ).rejects.toEqual(
          new ConflictException(
            `Multiple users with role corporateSecretary. Cannot create a ticket`,
          ),
        );
      });

      it('if there is no secretary, throw', async () => {
        const company = await Company.create({ name: 'test' });

        await expect(
          controller.create({
            companyId: company.id,
            type: TicketType.registrationAddressChange,
          }),
        ).rejects.toEqual(
          new ConflictException(
            `Cannot find user with role director to create a ticket`,
          ),
        );
      });

      it('throws error if duplicate registrationAddressChange ticket exists', async () => {
        const company = await Company.create({ name: 'test' });
        const user = await User.create({
          name: 'Test User',
          role: UserRole.corporateSecretary,
          companyId: company.id,
        });

        // Create the first ticket
        await Ticket.create({
          companyId: company.id,
          assigneeId: user.id,
          category: TicketCategory.corporate,
          type: TicketType.registrationAddressChange,
          status: TicketStatus.open,
        });

        // Try to create a duplicate
        await expect(
          controller.create({
            companyId: company.id,
            type: TicketType.registrationAddressChange,
          }),
        ).rejects.toEqual(
          new ConflictException(
            'Company already has an open registrationAddressChange ticket',
          ),
        );
      });

      it('allows creating registrationAddressChange ticket if previous one is resolved', async () => {
        const company = await Company.create({ name: 'test' });
        const user = await User.create({
          name: 'Test User',
          role: UserRole.corporateSecretary,
          companyId: company.id,
        });

        // Create the first ticket that is already resolved
        await Ticket.create({
          companyId: company.id,
          assigneeId: user.id,
          category: TicketCategory.corporate,
          type: TicketType.registrationAddressChange,
          status: TicketStatus.resolved,
        });

        // Should be able to create a new ticket
        const ticket = await controller.create({
          companyId: company.id,
          type: TicketType.registrationAddressChange,
        });

        expect(ticket.category).toBe(TicketCategory.corporate);
        expect(ticket.assigneeId).toBe(user.id);
        expect(ticket.status).toBe(TicketStatus.open);
      });

      it('assigns to director if no corporate secretary is found', async () => {
        const company = await Company.create({ name: 'test' });
        const director = await User.create({
          name: 'Test Director',
          role: UserRole.director,
          companyId: company.id,
        });

        const ticket = await controller.create({
          companyId: company.id,
          type: TicketType.registrationAddressChange,
        });

        expect(ticket.category).toBe(TicketCategory.corporate);
        expect(ticket.assigneeId).toBe(director.id);
        expect(ticket.status).toBe(TicketStatus.open);
      });

      it('throws error if multiple directors are found', async () => {
        const company = await Company.create({ name: 'test' });
        await User.create({
          name: 'Director 1',
          role: UserRole.director,
          companyId: company.id,
        });
        await User.create({
          name: 'Director 2',
          role: UserRole.director,
          companyId: company.id,
        });

        await expect(
          controller.create({
            companyId: company.id,
            type: TicketType.registrationAddressChange,
          }),
        ).rejects.toEqual(
          new ConflictException(
            `Multiple users with role director. Cannot create a ticket`,
          ),
        );
      });

      it('throws error if no corporate secretary or director is found', async () => {
        const company = await Company.create({ name: 'test' });
        await User.create({
          name: 'Accountant',
          role: UserRole.accountant,
          companyId: company.id,
        });

        await expect(
          controller.create({
            companyId: company.id,
            type: TicketType.registrationAddressChange,
          }),
        ).rejects.toEqual(
          new ConflictException(
            `Cannot find user with role director to create a ticket`,
          ),
        );
      });
    });

    describe('strikeOff', () => {
      it('resolves all open tickets when creating a strikeOff ticket', async () => {
        const company = await Company.create({ name: 'test' });
        const director = await User.create({
          name: 'Director',
          role: UserRole.director,
          companyId: company.id,
        });
        await User.create({
          name: 'Accountant',
          role: UserRole.accountant,
          companyId: company.id,
        });

        // Create some open tickets to be resolved
        await Ticket.create({
          companyId: company.id,
          assigneeId: director.id,
          category: TicketCategory.accounting,
          type: TicketType.managementReport,
          status: TicketStatus.open,
        });

        // Create strikeOff ticket
        const ticket = await controller.create({
          companyId: company.id,
          type: TicketType.strikeOff,
        });

        expect(ticket.category).toBe(TicketCategory.management);
        expect(ticket.assigneeId).toBe(director.id);
        expect(ticket.status).toBe(TicketStatus.open);

        // Check that other tickets are resolved
        const openTickets = await Ticket.findAll({
          where: {
            companyId: company.id,
            status: TicketStatus.open,
            type: TicketType.managementReport, // Check specific type instead of using Op
          },
        });
        expect(openTickets.length).toBe(0);

        const resolvedTickets = await Ticket.findAll({
          where: {
            companyId: company.id,
            status: TicketStatus.resolved,
          },
        });
        expect(resolvedTickets.length).toBe(1);
      });
    });

    describe('transaction tests', () => {
      it('successfully creates a ticket within a transaction', async () => {
        const company = await Company.create({ name: 'test' });
        const user = await User.create({
          name: 'Accountant',
          role: UserRole.accountant,
          companyId: company.id,
        });

        const ticket = await controller.create({
          companyId: company.id,
          type: TicketType.managementReport,
        });

        expect(ticket.id).toBeDefined();
        expect(ticket.category).toBe(TicketCategory.accounting);
        expect(ticket.assigneeId).toBe(user.id);
        expect(ticket.status).toBe(TicketStatus.open);
      });

      it('rolls back transaction when there is an error during ticket creation', async () => {
        const company = await Company.create({ name: 'test' });
        const director = await User.create({
          name: 'Director',
          role: UserRole.director,
          companyId: company.id,
        });

        // Create existing open tickets to test strikeOff logic
        const existingTicket = await Ticket.create({
          companyId: company.id,
          assigneeId: director.id,
          category: TicketCategory.management,
          type: TicketType.managementReport,
          status: TicketStatus.open,
        });

        // Spy on the transaction method
        const transactionSpy = jest.spyOn(sequelize, 'transaction');

        // Mock the create method to throw an error during ticket creation
        const createSpy = jest
          .spyOn(Ticket, 'create')
          .mockImplementationOnce(() => {
            throw new Error('Database error during creation');
          });

        // Try to create a strikeOff ticket which should fail
        await expect(
          controller.create({
            companyId: company.id,
            type: TicketType.strikeOff,
          }),
        ).rejects.toThrow('Database error during creation');

        expect(transactionSpy).toHaveBeenCalled();

        // Verify the existing tickets are still open (not resolved) due to rollback
        const ticketAfterRollback = await Ticket.findByPk(existingTicket.id);
        expect(ticketAfterRollback?.status).toBe(TicketStatus.open);

        // Clean up spies
        createSpy.mockRestore();
        transactionSpy.mockRestore();
      });

      it('handles transaction failure when updating tickets for strikeOff', async () => {
        const company = await Company.create({ name: 'test' });
        const director = await User.create({
          name: 'Director',
          role: UserRole.director,
          companyId: company.id,
        });

        // Create an existing open ticket
        await Ticket.create({
          companyId: company.id,
          assigneeId: director.id,
          category: TicketCategory.management,
          type: TicketType.managementReport,
          status: TicketStatus.open,
        });

        // Spy on the update method to throw an error
        const updateSpy = jest
          .spyOn(Ticket, 'update')
          .mockImplementationOnce(() => {
            throw new Error('Database error during update');
          });

        // Try to create a strikeOff ticket which should fail during update
        await expect(
          controller.create({
            companyId: company.id,
            type: TicketType.strikeOff,
          }),
        ).rejects.toThrow('Database error during update');

        // Verify no new ticket was created due to rollback
        const createdTickets = await Ticket.findAll({
          where: {
            companyId: company.id,
            type: TicketType.strikeOff,
          },
        });
        expect(createdTickets.length).toBe(0);

        // Clean up spy
        updateSpy.mockRestore();
      });

      it('ensures entire transaction is atomic', async () => {
        // This is a more complex test that ensures all operations happen or none do
        const company = await Company.create({ name: 'test' });
        const director = await User.create({
          name: 'Director',
          role: UserRole.director,
          companyId: company.id,
        });

        // Create multiple existing tickets
        for (let i = 0; i < 3; i++) {
          await Ticket.create({
            companyId: company.id,
            assigneeId: director.id,
            category: TicketCategory.management,
            type: TicketType.managementReport,
            status: TicketStatus.open,
          });
        }

        // Count existing tickets
        const initialTicketCount = await Ticket.count({
          where: {
            companyId: company.id,
            status: TicketStatus.open,
          },
        });
        expect(initialTicketCount).toBe(3);

        // Create a custom mock implementation that updates some tickets but then fails
        // This simulates a partial update before failure
        let updateCount = 0;

        // Use any for mock implementation - in tests this is acceptable
        // to bypass strict type checking
        const updateSpy = jest
          .spyOn(Ticket, 'update')
          .mockImplementation(
            async function mockUpdate(values, options): Promise<any> {
              updateCount++;
              if (updateCount === 1) {
                // Let the first update pass (simulating updating some tickets)

                return await Ticket.update(values, options);
              } else {
                // Fail on subsequent updates
                throw new Error('Simulated database error during update');
              }
            },
          );

        // Try to create a strikeOff ticket which should fail
        await expect(
          controller.create({
            companyId: company.id,
            type: TicketType.strikeOff,
          }),
        ).rejects.toThrow();

        // Verify that the transaction was rolled back and tickets remain unchanged
        const remainingOpenTickets = await Ticket.count({
          where: {
            companyId: company.id,
            status: TicketStatus.open,
          },
        });
        expect(remainingOpenTickets).toBe(initialTicketCount);

        // Cleanup
        updateSpy.mockRestore();
      });
    });
  });
});
