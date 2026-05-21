export interface CursorPaginated<T> {
  data: T[];
  meta: {
    nextCursor: string | null;
    prevCursor: string | null;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}
