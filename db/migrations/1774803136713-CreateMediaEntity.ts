import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMediaEntity1774803136713 implements MigrationInterface {
    name = 'CreateMediaEntity1774803136713'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "media_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" character varying NOT NULL, "hash" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_7f2f144c5119791dbeac5f5a9c8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "media_entity" ADD CONSTRAINT "FK_9ac54ee689711ec4364328d802f" FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "media_entity" DROP CONSTRAINT "FK_9ac54ee689711ec4364328d802f"`);
        await queryRunner.query(`DROP TABLE "media_entity"`);
    }

}
