import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeviceID1770203916084 implements MigrationInterface {
    name = 'AddDeviceID1770203916084'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_token_entity" ADD "deviceId" uuid NOT NULL DEFAULT uuid_generate_v4()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_token_entity" DROP COLUMN "deviceId"`);
    }

}
