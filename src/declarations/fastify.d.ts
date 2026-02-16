import 'fastify';
import { ICurrentUser } from 'src/user/types/user.types';

declare module 'fastify' {
  interface FastifyRequest {
    user?: ICurrentUser;
  }
}
