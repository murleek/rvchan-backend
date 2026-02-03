import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUpdatedAtColumn1770047943770 implements MigrationInterface {
  name = 'AddUpdatedAtColumn1770047943770';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_token_entity" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_token_entity" DROP COLUMN "updatedAt"`,
    );
  }
}
