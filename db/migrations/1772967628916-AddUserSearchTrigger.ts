import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserSearchTrigger1772967628916 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE FUNCTION user_search_vector_update() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector =
          setweight(to_tsvector('simple', coalesce(NEW.username,'')), 'A') ||
          setweight(to_tsvector('simple', coalesce(NEW."firstName",'')), 'B') ||
          setweight(to_tsvector('simple', coalesce(NEW."lastName",'')), 'B') ||
          setweight(to_tsvector('simple', coalesce(NEW.description,'')), 'C');
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER user_search_vector_trigger
      BEFORE INSERT OR UPDATE
      ON user_entity
      FOR EACH ROW
      EXECUTE FUNCTION user_search_vector_update()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS user_search_vector_trigger ON user_entity
    `);

    await queryRunner.query(`
      DROP FUNCTION IF EXISTS user_search_vector_update
    `);
  }
}
