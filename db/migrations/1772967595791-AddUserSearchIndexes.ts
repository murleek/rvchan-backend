import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserSearchIndexes1772967595791 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX user_search_vector_idx
      ON user_entity
      USING GIN(search_vector)
    `);

    await queryRunner.query(`
      CREATE INDEX user_username_trgm_idx
      ON user_entity
      USING GIN(username gin_trgm_ops)
    `);

    await queryRunner.query(`
      CREATE INDEX user_firstname_trgm_idx
      ON user_entity
      USING GIN("firstName" gin_trgm_ops)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX user_search_vector_idx`);
    await queryRunner.query(`DROP INDEX user_username_trgm_idx`);
    await queryRunner.query(`DROP INDEX user_firstname_trgm_idx`);
  }
}
