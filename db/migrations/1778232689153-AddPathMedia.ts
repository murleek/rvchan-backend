import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPathMedia1778232689153 implements MigrationInterface {
  name = 'AddPathMedia1778232689153';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
  ALTER TABLE "media_entity"
  ADD "path" character varying
`);

    await queryRunner.query(`
  UPDATE "media_entity"
  SET "path" = ''
`);

    await queryRunner.query(`
  ALTER TABLE "media_entity"
  ALTER COLUMN "path" SET NOT NULL
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "media_entity" DROP COLUMN "path"`);
  }
}
