import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Repository } from 'typeorm';
import sharp from 'sharp';
import { createHash } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { MediaEntity } from './entities/media.entity';
import { MultipartFile } from '@fastify/multipart';
import { UserEntity } from 'src/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { streamToBuffer } from 'src/common/utils/buffer';

export const SIZES = [1024, 512, 128, 32];

const linkValidFor = 3600;

@Injectable()
export class R2Provider {
  private readonly s3: S3Client;

  constructor(
    @InjectRepository(MediaEntity)
    private readonly repo: Repository<MediaEntity>,
  ) {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(
    file:
      | MultipartFile
      | { buffer: Buffer; filename: string; mimetype: string; isBuffer: true },
    user: UserEntity,
  ) {
    if (!('isBuffer' in file)) {
      if (file.file.truncated) {
        throw new Error('File too large');
      }
    }

    const buffer =
      'isBuffer' in file ? file.buffer : await streamToBuffer(file.file);

    const hash = createHash('sha1').update(buffer).digest('hex');

    const base = sharp(buffer).rotate().removeAlpha();
    const meta = await base.metadata();

    const sizedBuffers = await Promise.all(
      SIZES.map(async (size) => {
        let img = base;

        if (meta.width! > size || meta.height! > size) {
          img = img.resize({
            width: size,
            height: size,
            fit: 'inside',
            withoutEnlargement: true,
          });
        }

        return img.webp({ quality: 80 }).toBuffer();
      }),
    );

    await Promise.all(
      sizedBuffers.map((buf, index) => {
        const key = `${hash}_${SIZES[index]}.webp`;

        return this.s3.send(
          new PutObjectCommand({
            Bucket: 'uploads',
            Key: key,
            Body: buf,
            ContentType: 'image/webp',
          }),
        );
      }),
    );

    const fileDB = this.repo.create({
      hash,
      url: hash,
      originalName: file.filename,
      mimeType: file.mimetype,
      user,
    });

    return this.repo.save(fileDB);
  }

  async getDownloadUrl(
    id: string,
    size: (typeof SIZES)[number] = SIZES[0],
  ): Promise<string> {
    const file = await this.repo.findOne({ where: { id } });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const command = new GetObjectCommand({
      Bucket: 'uploads',
      Key: file.hash + '_' + size + '.webp',
    });

    return await getSignedUrl(this.s3, command, { expiresIn: linkValidFor });
  }
}
