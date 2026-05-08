import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaEntity } from './entities/media.entity';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(MediaEntity)
    private readonly mediaRepository: Repository<MediaEntity>,
  ) {}

  async findById(id: string): Promise<MediaEntity | null> {
    return await this.mediaRepository.findOne({
      where: { id },
    });
  }

  // async create(userId: string): Promise<MediaEntity> {
  //   const id = uuidv4();
  //   const original_key = `users/${userId}/${id}.webp`;
  //   const media: CreateMedia = {
  //     id,
  //     userId,
  //     original_key,
  //   };

  //   const created = await this.mediaRepository.save(media);

  //   return created;
  // }

  // async findById(id: string): Promise<MediaEntity | null> {
  //   return await this.mediaRepository.findOne({
  //     where: { id },
  //   });
  // }

  // async markAsUploaded(id: string): Promise<MediaEntity | null> {
  //   const media = await this.findById(id);
  //   if (!media) throw new NotFoundException();

  //   const merged = this.mediaRepository.merge(media, { uploaded: true });

  //   return await this.mediaRepository.save(merged);
  // }
}
