import { UserState } from 'src/user/types/user.types';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserStateEnumRename1770823944553 implements MigrationInterface {
  name = 'UserStateEnumRename1770823944553';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const key of Object.keys(UserState)) {
      const value = UserState[key as keyof typeof UserState];
      await queryRunner.query(`
        UPDATE "user_entity"
        SET "state" = '${value}'
        WHERE LOWER("state") = LOWER('${value}')
      `);
    }
    await queryRunner.query(
      `ALTER TABLE "user_entity" ALTER COLUMN "state" SET DEFAULT 'INIT'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" ALTER COLUMN "state" SET DEFAULT 'init'`,
    );
    for (const key of Object.keys(UserState)) {
      const value = UserState[key as keyof typeof UserState];
      await queryRunner.query(`
        UPDATE "user_entity"
        SET "state" = LOWER('${value}')
        WHERE "state" = '${value}'
      `);
    }
  }
}
