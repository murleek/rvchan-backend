import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameAvatarInUser1778510860123 implements MigrationInterface {
  name = 'RenameAvatarInUser1778510860123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_entity"
      ADD COLUMN "avatarId" uuid
    `);

    await queryRunner.query(`
      UPDATE "user_entity" u
      SET "avatarId" = m.id
      FROM "media_entity" m
      WHERE m.url = u."avatarUrl"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_entity"
      ADD CONSTRAINT "FK_b8ff7c4949e12585b6ba48ec676"
      FOREIGN KEY ("avatarId")
      REFERENCES "media_entity"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "user_entity"
      DROP COLUMN "avatarUrl"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_entity"
      ADD COLUMN "avatarUrl" varchar
    `);

    await queryRunner.query(`
      UPDATE "user_entity" u
      SET "avatarUrl" = m.url
      FROM "media_entity" m
      WHERE m.id = u."avatarId"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_entity"
      DROP CONSTRAINT "FK_b8ff7c4949e12585b6ba48ec676"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_entity"
      DROP COLUMN "avatarId"
    `);
  }
}
