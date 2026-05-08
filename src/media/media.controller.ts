import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { MediaService } from './media.service';
import { R2Provider, SIZES } from './r2.provider';
import z from 'zod';
import { UserEntity } from 'src/user/entities/user.entity';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { States } from 'src/user/decorators/authorization.decorator';
import { UserState } from 'src/user/types/user.types';
import { ProvidedFile } from 'src/common/decorators/file.decorator';
import type { MultipartFile } from '@fastify/multipart';
import { UploadGuard } from 'src/common/guards/upload.guard';

// ## upload flow
// - get upload url(url that can expire, id for assignment)
// - upload to this url
// - assign to entity with id for assignment

const GetUploadUrlSchema = z.object({
  size: z.enum(SIZES.map(String)).optional(),
});
class GetUploadUrlDto extends createZodDto(GetUploadUrlSchema) {}

@Controller('media')
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly cf: R2Provider,
  ) {}

  @Post('upload')
  @UseGuards(UploadGuard, JwtAuthGuard)
  @States(UserState.ACTIVE)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        // Define the file property for Swagger UI
        file: {
          type: 'string',
          format: 'binary',
          description: 'The file to upload',
        },
      },
      required: ['file'],
    },
  })
  // async getUploadUrl(
  //   @ProvidedFile() file: MultipartFile,
  //   @CurrentUser() user: UserEntity,
  // ) {
  //   if (!user) throw new ForbiddenException();

  //   // const media = await this.mediaService.create(user.id);

  //   return await this.cf.uploadFile(file, user);
  // }

  // @Post('mark-as-uploaded')
  // @ApiOkResponse()
  // async markAsUploaded(
  //   @Query() params: MarkAsUploadedDto,
  //   @Ability() ability: AppAbility,
  //   @Auth() user?: UserEntity,
  // ) {
  //   if (!user) throw new ForbiddenException();
  //   return await this.mediaService.markAsUploadedSafe(params.id, ability);
  // }
  @Get('file/:id')
  async getDownloadUrl(
    @Param('id') id: string,
    @Query() params: GetUploadUrlDto,
  ): Promise<string> {
    const signed = await this.cf.getDownloadUrl(id, Number(params.size));

    return signed;
  }
}
