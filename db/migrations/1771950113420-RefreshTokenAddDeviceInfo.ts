import { MigrationInterface, QueryRunner } from "typeorm";

export class RefreshTokenAddDeviceInfo1771950113420 implements MigrationInterface {
    name = 'RefreshTokenAddDeviceInfo1771950113420'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_token_entity" ADD "browser" character varying`);
        await queryRunner.query(`ALTER TABLE "refresh_token_entity" ADD "browserVersion" character varying`);
        await queryRunner.query(`ALTER TABLE "refresh_token_entity" ADD "deviceModel" character varying`);
        await queryRunner.query(`ALTER TABLE "refresh_token_entity" ADD "deviceType" character varying`);
        await queryRunner.query(`ALTER TABLE "refresh_token_entity" ADD "deviceVendor" character varying`);
        await queryRunner.query(`ALTER TABLE "refresh_token_entity" ADD "os" character varying`);
        await queryRunner.query(`ALTER TABLE "refresh_token_entity" ADD "osVersion" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_token_entity" DROP COLUMN "osVersion"`);
        await queryRunner.query(`ALTER TABLE "refresh_token_entity" DROP COLUMN "os"`);
        await queryRunner.query(`ALTER TABLE "refresh_token_entity" DROP COLUMN "deviceVendor"`);
        await queryRunner.query(`ALTER TABLE "refresh_token_entity" DROP COLUMN "deviceType"`);
        await queryRunner.query(`ALTER TABLE "refresh_token_entity" DROP COLUMN "deviceModel"`);
        await queryRunner.query(`ALTER TABLE "refresh_token_entity" DROP COLUMN "browserVersion"`);
        await queryRunner.query(`ALTER TABLE "refresh_token_entity" DROP COLUMN "browser"`);
    }

}
