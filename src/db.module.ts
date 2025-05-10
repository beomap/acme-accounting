import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SequelizeModuleOptions } from '@nestjs/sequelize/dist/interfaces/sequelize-options.interface';
import { Company } from '../db/models/Company';
import { Ticket } from '../db/models/Ticket';
import { User } from '../db/models/User';
import dbConfig from '../db/config/config.json';
import { Sequelize } from 'sequelize-typescript';

const devConfig = dbConfig.development as SequelizeModuleOptions;
const testConfig = dbConfig.test as SequelizeModuleOptions;

const config = process.env.NODE_ENV === 'test' ? testConfig : devConfig;

@Module({
  imports: [
    SequelizeModule.forRoot({
      ...config,
      models: [Company, User, Ticket],
    }),
  ],
  exports: ['SEQUELIZE'],
  providers: [
    {
      provide: 'SEQUELIZE',
      useFactory: () => {
        const sequelize = new Sequelize({
          ...config,
          models: [Company, User, Ticket],
        });
        return sequelize;
      },
    },
  ],
})
export class DbModule {}
