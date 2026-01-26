import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from '../../db/typeorm.config';

@Module({
  imports: [TypeOrmModule.forRoot(dataSourceOptions)],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
