import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUsersColumn1770025981891 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD "firstName" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD "lastName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD "description" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" DROP COLUMN "description"`,
    );
    await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "lastName"`);
    await queryRunner.query(
      `ALTER TABLE "user_entity" DROP COLUMN "firstName"`,
    );
  }
}
