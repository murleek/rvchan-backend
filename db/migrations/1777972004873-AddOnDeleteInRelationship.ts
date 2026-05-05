import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOnDeleteInRelationship1777972004873 implements MigrationInterface {
    name = 'AddOnDeleteInRelationship1777972004873'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_follows_entity" DROP CONSTRAINT "FK_3d080ee0029e5a0625a666d0af3"`);
        await queryRunner.query(`ALTER TABLE "user_follows_entity" DROP CONSTRAINT "FK_47706e15c3f4b9e830b7b91bc0e"`);
        await queryRunner.query(`ALTER TABLE "user_blocks_entity" DROP CONSTRAINT "FK_2e9486b3e46eda16fcdf69a7efe"`);
        await queryRunner.query(`ALTER TABLE "user_blocks_entity" DROP CONSTRAINT "FK_905fb4c7e5d404428dcda605521"`);
        await queryRunner.query(`ALTER TABLE "notification_entity" DROP CONSTRAINT "FK_adaefe08b8d8b0efb4ef3919941"`);
        await queryRunner.query(`ALTER TABLE "user_follows_entity" ADD CONSTRAINT "FK_3d080ee0029e5a0625a666d0af3" FOREIGN KEY ("followerId") REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_follows_entity" ADD CONSTRAINT "FK_47706e15c3f4b9e830b7b91bc0e" FOREIGN KEY ("followingId") REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_blocks_entity" ADD CONSTRAINT "FK_905fb4c7e5d404428dcda605521" FOREIGN KEY ("blockerId") REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_blocks_entity" ADD CONSTRAINT "FK_2e9486b3e46eda16fcdf69a7efe" FOREIGN KEY ("blockedId") REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_entity" ADD CONSTRAINT "FK_adaefe08b8d8b0efb4ef3919941" FOREIGN KEY ("actor_id") REFERENCES "user_entity"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification_entity" DROP CONSTRAINT "FK_adaefe08b8d8b0efb4ef3919941"`);
        await queryRunner.query(`ALTER TABLE "user_blocks_entity" DROP CONSTRAINT "FK_2e9486b3e46eda16fcdf69a7efe"`);
        await queryRunner.query(`ALTER TABLE "user_blocks_entity" DROP CONSTRAINT "FK_905fb4c7e5d404428dcda605521"`);
        await queryRunner.query(`ALTER TABLE "user_follows_entity" DROP CONSTRAINT "FK_47706e15c3f4b9e830b7b91bc0e"`);
        await queryRunner.query(`ALTER TABLE "user_follows_entity" DROP CONSTRAINT "FK_3d080ee0029e5a0625a666d0af3"`);
        await queryRunner.query(`ALTER TABLE "notification_entity" ADD CONSTRAINT "FK_adaefe08b8d8b0efb4ef3919941" FOREIGN KEY ("actor_id") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_blocks_entity" ADD CONSTRAINT "FK_905fb4c7e5d404428dcda605521" FOREIGN KEY ("blockerId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_blocks_entity" ADD CONSTRAINT "FK_2e9486b3e46eda16fcdf69a7efe" FOREIGN KEY ("blockedId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_follows_entity" ADD CONSTRAINT "FK_47706e15c3f4b9e830b7b91bc0e" FOREIGN KEY ("followingId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_follows_entity" ADD CONSTRAINT "FK_3d080ee0029e5a0625a666d0af3" FOREIGN KEY ("followerId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
