import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateColumns1774804608689 implements MigrationInterface {
    name = 'UpdateColumns1774804608689'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "avatarUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "media_entity" ADD "originalName" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "media_entity" ADD "mimeType" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "media_entity" DROP COLUMN "mimeType"`);
        await queryRunner.query(`ALTER TABLE "media_entity" DROP COLUMN "originalName"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "avatarUrl"`);
    }

}
