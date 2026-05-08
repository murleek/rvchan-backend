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
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { type Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

export const SIZES = [1024, 512, 128, 32];
export type ImageSizes = (typeof SIZES)[number];

export const PathType = {
  AVATAR: 'avatars',
  POST: 'posts',
  OTHER: 'other',
} as const;
export type PathType = (typeof PathType)[keyof typeof PathType];

const linkValidFor = 3600;

@Injectable()
export class R2Provider {
  private readonly s3: S3Client;

  constructor(
    @InjectRepository(MediaEntity)
    private readonly repo: Repository<MediaEntity>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
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
  async getMedia(id: string) {
    const cacheKey = `media:${id}`;

    let file = (await this.cache.get<MediaEntity>(cacheKey)) ?? null;

    if (!file) {
      file = await this.repo.findOne({ where: { id } });

      if (!file) {
        throw new NotFoundException('File not found');
      }

      await this.cache.set(cacheKey, file, 60 * 10); // 10 минут
    }

    return file;
  }
  async uploadFile(
    file:
      | MultipartFile
      | { buffer: Buffer; filename: string; mimetype: string; isBuffer: true },
    user: UserEntity,
    path: PathType,
  ) {
    if (!('isBuffer' in file)) {
      if (file.file.truncated) {
        throw new Error('File too large');
      }
    }
    if (!path) {
      throw new Error('Path is required');
    }

    const buffer =
      'isBuffer' in file ? file.buffer : await streamToBuffer(file.file);

    const hash = createHash('sha1').update(buffer).digest('hex');

    const base = sharp(buffer).rotate().removeAlpha();
    const meta = await base.metadata();

    const sizedBuffers = await Promise.all(
      SIZES.map(async (size) => {
        let img = base;

        if (meta.width > size || meta.height > size) {
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
        const fileName = `${SIZES[index]}.webp`;

        return this.s3.send(
          new PutObjectCommand({
            Bucket: path,
            Key: `${hash}/${fileName}`,
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
      path,
      user,
    });

    return this.repo.save(fileDB);
  }

  async getUrlFromFile(file: MediaEntity, size: ImageSizes = SIZES[0]) {
    const cacheKey = `url:${file.hash}:${size}`;

    const cached = await this.cache.get<string>(cacheKey);
    if (cached) return cached;

    const command = new GetObjectCommand({
      Bucket: file.path,
      Key: `${file.url}/${size}.webp`,
    });

    const url = await getSignedUrl(this.s3, command, {
      expiresIn: linkValidFor,
    });

    // кешируем чуть меньше чем TTL S3 ссылки
    await this.cache.set(cacheKey, url, linkValidFor - 60);

    return url;
  }

  async getDownloadUrl(id: string, size: ImageSizes = SIZES[0]) {
    const file = await this.getMedia(id);

    return await this.getUrlFromFile(file, size);
  }

  async getAllDownloadUrl(id: string) {
    const file = await this.getMedia(id);

    const urls: Record<ImageSizes, string> = {} as any;

    await Promise.all(
      SIZES.map(async (size) => {
        urls[size] = await this.getUrlFromFile(file, size);
      }),
    );

    return urls;
  }
}
