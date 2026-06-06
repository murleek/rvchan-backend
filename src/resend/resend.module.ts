import { Module } from '@nestjs/common';
import { ResendService } from './resend.service';
import { TemplateService } from './template.service';

@Module({
  providers: [ResendService, TemplateService],
  exports: [ResendService],
})
export class ResendModule {}
