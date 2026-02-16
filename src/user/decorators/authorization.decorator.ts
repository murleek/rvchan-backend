import { SetMetadata } from '@nestjs/common';
import { UserState } from '../types/user.types';

export const AUTH_KEY = 'authorization';

export type IncludeOrExclude<T> = { include: T[] } | { exclude: T[] };

function isIncludeOrExclude(obj: any): obj is IncludeOrExclude<UserState> {
  return (
    obj && typeof obj === 'object' && ('include' in obj || 'exclude' in obj)
  );
}

export interface AuthorizeOptions {
  states?: IncludeOrExclude<UserState>;
}

export const Authorize = (options: AuthorizeOptions) =>
  SetMetadata(AUTH_KEY, options);

export const States = (
  ...states: (UserState | IncludeOrExclude<UserState>)[]
) => {
  if (states.length === 0) return Authorize({});
  if (states.length === 1 && isIncludeOrExclude(states[0])) {
    return Authorize({ states: states[0] as IncludeOrExclude<UserState> });
  }

  return Authorize({ states: { include: states as UserState[] } });
};
