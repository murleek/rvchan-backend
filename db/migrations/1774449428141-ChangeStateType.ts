import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeStateType1774449428141 implements MigrationInterface {
  name = 'ChangeStateType1774449428141';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_entity_state_enum" AS ENUM('INIT', 'ACTIVE', 'INACTIVE', 'BANNED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" ALTER COLUMN "state" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" ALTER COLUMN "state" TYPE "public"."user_entity_state_enum" USING "state"::text::"public"."user_entity_state_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" ALTER COLUMN "state" SET DEFAULT 'INIT'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" ALTER COLUMN "state" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_entity" ALTER COLUMN "state" TYPE varchar USING "state"::text`,
    );
    await queryRunner.query(`DROP TYPE "public"."user_entity_state_enum"`);
  }
}
