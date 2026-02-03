import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRefreshTokenColumns1770033892500 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "refresh_token_entity"
      ADD "ip" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "refresh_token_entity"
      ADD "userAgent" character varying
    `);

    await queryRunner.query(`
      UPDATE "refresh_token_entity"
      SET ip = 'unknown',
          "userAgent" = 'unknown'
      WHERE ip IS NULL OR "userAgent" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "refresh_token_entity" 
      ALTER COLUMN "ip" SET NOT NULL, 
      ALTER COLUMN "ip" SET DEFAULT 'unknown',
      ALTER COLUMN "userAgent" SET NOT NULL,
      ALTER COLUMN "userAgent" SET DEFAULT 'unknown'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_token_entity" DROP COLUMN "userAgent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_token_entity" DROP COLUMN "ip"`,
    );
  }
}
