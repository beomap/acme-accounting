import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { newTicketSchema } from '../tickets/ticket.schema';

@Injectable()
export class ZodValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    try {
      // Select the schema based on the route
      let schema: AnyZodObject;

      // Here we can expand with more routes in the future
      if (req.path === '/api/v1/tickets' && req.method === 'POST') {
        schema = newTicketSchema;
      } else {
        // If no schema is found for this route, just continue
        return next();
      }

      // Validate the request body against the schema
      const validatedBody = schema.parse(req.body);

      // Replace the request body with the validated result
      req.body = validatedBody;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format the validation errors
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        throw new BadRequestException({
          message: 'Validation failed',
          errors: formattedErrors,
        });
      }

      throw error;
    }
  }
}
