import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.getOrThrow('DB_HOST'),
  port: +(configService.getOrThrow<number>('DB_PORT') || 5432),
  username: configService.getOrThrow('DB_USERNAME'),
  password: configService.getOrThrow('DB_PASSWORD'),
  database: configService.getOrThrow('DB_NAME'),
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/db/migrations/*.js'],
  migrationsTableName: 'migrations',
  migrationsRun: false,
  synchronize: false,
  // logging: process.env.ENV !== 'production',
};

const AppDataSource = new DataSource(dataSourceOptions);

export default AppDataSource;
