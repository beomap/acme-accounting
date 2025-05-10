import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { ZodValidationMiddleware } from '../middleware/zod-validation.middleware';
import { DbModule } from '../db.module';

@Module({
  imports: [DbModule],
  controllers: [TicketsController],
})
export class TicketsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ZodValidationMiddleware)
      .forRoutes({ path: 'api/v1/tickets', method: RequestMethod.POST });
  }
}
