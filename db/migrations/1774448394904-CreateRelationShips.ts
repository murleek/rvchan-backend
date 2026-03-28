import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRelationShips1774448394904 implements MigrationInterface {
    name = 'CreateRelationShips1774448394904'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_follows_entity" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "followerId" integer, "followingId" integer, CONSTRAINT "UQ_06a5fc582949989b3243571856e" UNIQUE ("followerId", "followingId"), CONSTRAINT "PK_8e2c3ccb849ac34795659d1399f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_47706e15c3f4b9e830b7b91bc0" ON "user_follows_entity" ("followingId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3d080ee0029e5a0625a666d0af" ON "user_follows_entity" ("followerId") `);
        await queryRunner.query(`CREATE TABLE "user_blocks_entity" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "blockerId" integer, "blockedId" integer, CONSTRAINT "UQ_1ab975b1eacf4802f3ff50cfde7" UNIQUE ("blockerId", "blockedId"), CONSTRAINT "PK_c49a7d5abc73f71c411900b14ba" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2e9486b3e46eda16fcdf69a7ef" ON "user_blocks_entity" ("blockedId") `);
        await queryRunner.query(`CREATE INDEX "IDX_905fb4c7e5d404428dcda60552" ON "user_blocks_entity" ("blockerId") `);
        await queryRunner.query(`ALTER TABLE "user_follows_entity" ADD CONSTRAINT "FK_3d080ee0029e5a0625a666d0af3" FOREIGN KEY ("followerId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_follows_entity" ADD CONSTRAINT "FK_47706e15c3f4b9e830b7b91bc0e" FOREIGN KEY ("followingId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_blocks_entity" ADD CONSTRAINT "FK_905fb4c7e5d404428dcda605521" FOREIGN KEY ("blockerId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_blocks_entity" ADD CONSTRAINT "FK_2e9486b3e46eda16fcdf69a7efe" FOREIGN KEY ("blockedId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_blocks_entity" DROP CONSTRAINT "FK_2e9486b3e46eda16fcdf69a7efe"`);
        await queryRunner.query(`ALTER TABLE "user_blocks_entity" DROP CONSTRAINT "FK_905fb4c7e5d404428dcda605521"`);
        await queryRunner.query(`ALTER TABLE "user_follows_entity" DROP CONSTRAINT "FK_47706e15c3f4b9e830b7b91bc0e"`);
        await queryRunner.query(`ALTER TABLE "user_follows_entity" DROP CONSTRAINT "FK_3d080ee0029e5a0625a666d0af3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_905fb4c7e5d404428dcda60552"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2e9486b3e46eda16fcdf69a7ef"`);
        await queryRunner.query(`DROP TABLE "user_blocks_entity"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3d080ee0029e5a0625a666d0af"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_47706e15c3f4b9e830b7b91bc0"`);
        await queryRunner.query(`DROP TABLE "user_follows_entity"`);
    }

}
