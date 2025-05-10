import { z } from 'zod';
import { TicketType } from '../../db/models/Ticket';

// Schema for creating a new ticket
export const newTicketSchema = z.object({
  type: z.nativeEnum(TicketType, {
    errorMap: () => ({ message: 'Invalid ticket type' }),
  }),
  companyId: z.number().int().positive({
    message: 'Company ID must be a positive integer',
  }),
});

// Type for the validated input
export type NewTicketInput = z.infer<typeof newTicketSchema>;
