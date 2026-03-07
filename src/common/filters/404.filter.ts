import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { version } from '../../../package.json';

@Catch(NotFoundException)
export class NotFoundExceptionFilter implements ExceptionFilter {
  catch(_exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    response.status(404).header('Content-Type', 'text/html').send(`
        <html>
          <head>
          <meta name="color-scheme" content="light dark">
            <title>404 Not Found</title>
          </head>
          <body>
            <pre><b>page not found</b></pre>
            <hr/>
            <pre>rvchan api v${version}</pre>
          </body>
        </html>
      `);
  }
}
