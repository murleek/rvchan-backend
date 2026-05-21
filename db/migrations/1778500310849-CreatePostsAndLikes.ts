import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePostsAndLikes1778500310849 implements MigrationInterface {
  name = 'CreatePostsAndLikes1778500310849';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "reaction_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" integer NOT NULL, "postId" integer NOT NULL, "reaction" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_08ba85dae358b866280b4de317f" UNIQUE ("userId", "postId"), CONSTRAINT "PK_b7a6f92ef8ca527f22c1a733170" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "post_entity" ("id" SERIAL NOT NULL, "content" text NOT NULL, "userId" integer NOT NULL, "parentId" integer, "replyCount" integer NOT NULL DEFAULT '0', "likeCount" integer NOT NULL DEFAULT '0', "isDeleted" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_58a149c4e88bf49036bc4c8c79f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions_entity" ADD "internalId" SERIAL NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions_entity" ADD CONSTRAINT "UQ_7213990b3abd99102d78181a479" UNIQUE ("internalId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_entity" ADD "internalId" SERIAL NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_entity" ADD CONSTRAINT "UQ_41c11528144536bcb6d0f7728f6" UNIQUE ("internalId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "reaction_entity" ADD CONSTRAINT "FK_ec42c5a5dfd35f948b93cdf04f7" FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reaction_entity" ADD CONSTRAINT "FK_9bb35f70f78a3a7b368d4719474" FOREIGN KEY ("postId") REFERENCES "post_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_entity" ADD CONSTRAINT "FK_5e32998d7ac08f573cde04fbfa5" FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_entity" ADD CONSTRAINT "FK_818b1ea228a8ba78dea46e29158" FOREIGN KEY ("parentId") REFERENCES "post_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_entity" DROP CONSTRAINT "FK_818b1ea228a8ba78dea46e29158"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_entity" DROP CONSTRAINT "FK_5e32998d7ac08f573cde04fbfa5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reaction_entity" DROP CONSTRAINT "FK_9bb35f70f78a3a7b368d4719474"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reaction_entity" DROP CONSTRAINT "FK_ec42c5a5dfd35f948b93cdf04f7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_entity" DROP CONSTRAINT "UQ_41c11528144536bcb6d0f7728f6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_entity" DROP COLUMN "internalId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions_entity" DROP CONSTRAINT "UQ_7213990b3abd99102d78181a479"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions_entity" DROP COLUMN "internalId"`,
    );
    await queryRunner.query(`DROP TABLE "post_entity"`);
    await queryRunner.query(`DROP TABLE "reaction_entity"`);
  }
}
