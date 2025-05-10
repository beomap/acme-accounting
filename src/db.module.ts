import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Company } from '../db/models/Company';
import { Ticket } from '../db/models/Ticket';
import { User } from '../db/models/User';
import { Sequelize } from 'sequelize-typescript';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: configService.get('database.dialect'),
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        models: [Company, User, Ticket],
      }),
    }),
  ],
  exports: ['SEQUELIZE'],
  providers: [
    {
      provide: 'SEQUELIZE',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const sequelize = new Sequelize({
          dialect: configService.get('database.dialect'),
          host: configService.get('database.host'),
          port: configService.get('database.port'),
          username: configService.get('database.username'),
          password: configService.get('database.password'),
          database: configService.get('database.database'),
          models: [Company, User, Ticket],
        });
        return sequelize;
      },
    },
  ],
})
export class DbModule {}
