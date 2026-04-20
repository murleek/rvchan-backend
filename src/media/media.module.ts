import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { R2Provider } from './r2.provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaEntity } from './entities/media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MediaEntity])],
  providers: [MediaService, R2Provider],
  controllers: [MediaController],
  exports: [MediaService, R2Provider],
})
export class MediaModule {}
