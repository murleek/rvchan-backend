import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserSearchVector1772967567250 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE user_entity
      ADD COLUMN search_vector tsvector
    `);

    await queryRunner.query(`
      UPDATE user_entity
      SET search_vector =
        setweight(to_tsvector('simple', coalesce(username,'')), 'A') ||
        setweight(to_tsvector('simple', coalesce("firstName",'')), 'B') ||
        setweight(to_tsvector('simple', coalesce("lastName",'')), 'B') ||
        setweight(to_tsvector('simple', coalesce(description,'')), 'C')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE user_entity
      DROP COLUMN search_vector
    `);
  }
}
