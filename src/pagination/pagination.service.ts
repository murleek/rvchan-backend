import { Injectable } from '@nestjs/common';
import {
  FindManyOptions,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

import { CursorPaginationDto } from './dto/cursor-pagination.dto';
import { CursorPaginated } from './interfaces/cursor-pagination.interface';
import { OffsetPaginationDto } from './dto/offset-pagination.dto';
import { OffsetPaginated } from './interfaces/offset-pagination.interface';

interface PaginateOptions<T, U> {
  order?: 'ASC' | 'DESC';
  map?: (item: T) => Promise<U> | U;
}

interface CursorOptions<T, U> extends PaginateOptions<T, U> {
  cursorField?: string;
  type?: 'cursor';
  findOptions?: never;
}

interface OffsetOptions<T, U> extends PaginateOptions<T, U> {
  type?: 'offset';
  findOptions?: FindManyOptions<T>;
  cursorField?: never;
}

@Injectable()
export class PaginationService {
  encodeCursor(value: string | number): string {
    return Buffer.from(String(value)).toString('base64url');
  }

  decodeCursor(cursor: string): string {
    return Buffer.from(cursor, 'base64url').toString('utf8');
  }

  // ==================== CURSOR PAGINATION ====================

  async cursorPaginate<T extends ObjectLiteral, U = T>(
    repository: Repository<T>,
    params: CursorPaginationDto | undefined,
    options: CursorOptions<T, U> = {},
  ): Promise<CursorPaginated<U>> {
    const qb = repository.createQueryBuilder('entity');
    return this.cursorPaginateQueryBuilder(qb, params, options);
  }

  async cursorPaginateQueryBuilder<T extends ObjectLiteral, U = T>(
    qb: SelectQueryBuilder<T>,
    params: CursorPaginationDto | undefined,
    options: CursorOptions<T, U> = {},
  ): Promise<CursorPaginated<U>> {
    const { cursorField = 'id' as keyof T & string, order = 'DESC' } = options;

    const { limit, before, after } = params || {
      limit: 20,
      before: undefined,
      after: undefined,
    };
    const take = limit + 1;

    // Добавляем пагинацию по курсору
    if (before) {
      const decodedCursor = this.decodeCursor(before);
      const operator = order === 'DESC' ? '>' : '<';

      qb.andWhere(`entity.${cursorField} ${operator} :cursorValue`, {
        cursorValue: decodedCursor,
      });
    } else if (after) {
      const decodedCursor = this.decodeCursor(after);
      const operator = order === 'DESC' ? '<' : '>';

      qb.andWhere(`entity.${cursorField} ${operator} :cursorValue`, {
        cursorValue: decodedCursor,
      });
    }

    // Применяем сортировку
    qb.orderBy(`entity.${cursorField}`, order);

    // Выполняем запрос
    const data = await qb.take(take).getMany();

    const hasNextPage = data.length > limit;
    const hasPrevPage = data.length < limit;
    if (hasNextPage) data.pop();

    const nextCursor =
      hasNextPage && data.length > 0
        ? this.encodeCursor(String(data[data.length - 1][cursorField]))
        : null;

    const prevCursor =
      hasPrevPage && data.length > 0
        ? this.encodeCursor(String(data[0][cursorField]))
        : null;

    let mappedData: T[] | U[] = data;

    if (options) {
      const { map } = options;
      if (map) {
        mappedData = await Promise.all(data.map(map));
      }
    }

    return {
      data: mappedData as unknown as U[],
      meta: {
        nextCursor,
        prevCursor,
        hasNextPage,
        hasPrevPage: !!before,
        limit,
      },
    };
  }

  // ==================== OFFSET PAGINATION ====================

  async offsetPaginate<T extends ObjectLiteral, U = T>(
    repository: Repository<T>,
    params: OffsetPaginationDto | undefined,
    options?: OffsetOptions<T, U>,
  ): Promise<OffsetPaginated<U>> {
    const qb = repository.createQueryBuilder('entity');
    return this.offsetPaginateQueryBuilder(qb, params, options);
  }

  async offsetPaginateQueryBuilder<T extends ObjectLiteral, U = T>(
    qb: SelectQueryBuilder<T>,
    params: OffsetPaginationDto | undefined,
    options?: OffsetOptions<T, U>,
  ): Promise<OffsetPaginated<U>> {
    const { page, limit } = params || { page: 1, limit: 20 };
    const skip = (page - 1) * limit;

    const result = await Promise.all([
      qb.skip(skip).take(limit).getMany(),
      qb.clone().getCount(), // клонируем, чтобы не ломать основной запрос
    ]);

    let data: T[] | U[] = result[0];
    const total = result[1];

    if (options) {
      const { map } = options;
      if (map) {
        data = await Promise.all(data.map(map));
      }
    }

    const totalPages = Math.ceil(total / limit);

    return {
      data: data as unknown as U[],
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // ==================== УНИВЕРСАЛЬНЫЙ МЕТОД ====================

  async paginate<T extends ObjectLiteral, U = T>(
    repo: Repository<T> | SelectQueryBuilder<T>,
    params: CursorPaginationDto | OffsetPaginationDto | undefined,
    options?: CursorOptions<T, U> | OffsetOptions<T, U>,
  ): Promise<CursorPaginated<U> | OffsetPaginated<U>> {
    const isCursor =
      params instanceof CursorPaginationDto || options?.type === 'cursor';

    const isQueryBuilder = 'getQuery' in repo;

    if (isCursor) {
      if (isQueryBuilder) {
        return this.cursorPaginateQueryBuilder(
          repo,
          params,
          options as CursorOptions<T, U>,
        );
      }
      return this.cursorPaginate(repo, params, options as CursorOptions<T, U>);
    } else {
      if (isQueryBuilder) {
        return this.offsetPaginateQueryBuilder(
          repo,
          params,
          options as OffsetOptions<T, U>,
        );
      }
      return this.offsetPaginate(repo, params, options as OffsetOptions<T, U>);
    }
  }
}
