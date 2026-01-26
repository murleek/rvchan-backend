import { Injectable } from '@nestjs/common';
import { version } from '../package.json';

@Injectable()
export class AppService {
  getHello(): string {
    return `<meta name="color-scheme" content="light dark"><pre>rvchan api v${version}</pre>`;
  }
}
