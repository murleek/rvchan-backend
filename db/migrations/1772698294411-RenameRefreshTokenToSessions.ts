import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameRefreshTokenToSessions1772698294411 implements MigrationInterface {
  name = 'RenameRefreshTokenToSessions1772698294411';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('refresh_token_entity');
    if (!table) return;

    table.name = 'sessions_entity';
    await queryRunner.renameTable('refresh_token_entity', 'sessions_entity');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('sessions_entity');
    if (!table) return;

    table.name = 'refresh_token_entity';
    await queryRunner.renameTable('sessions_entity', 'refresh_token_entity');
  }
}
