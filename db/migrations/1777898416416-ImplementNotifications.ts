import { MigrationInterface, QueryRunner } from "typeorm";

export class ImplementNotifications1777898416416 implements MigrationInterface {
    name = 'ImplementNotifications1777898416416'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notification_entity_type_enum" AS ENUM('follow', 'follow_accepted', 'new_device')`);
        await queryRunner.query(`CREATE TABLE "notification_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."notification_entity_type_enum" NOT NULL, "groupKey" character varying, "count" integer NOT NULL DEFAULT '1', "actors" jsonb NOT NULL DEFAULT '[]', "payload" jsonb, "isRead" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "recipient_id" integer, "actor_id" integer, CONSTRAINT "PK_112676de71a3a708b914daed289" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0bcbd23ad8ee331728ba6f9a3d" ON "notification_entity" ("groupKey", "isRead") `);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user_entity" ADD "lastActiveAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "notification_entity" ADD CONSTRAINT "FK_306a10824978602f6e7647df42d" FOREIGN KEY ("recipient_id") REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_entity" ADD CONSTRAINT "FK_adaefe08b8d8b0efb4ef3919941" FOREIGN KEY ("actor_id") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification_entity" DROP CONSTRAINT "FK_adaefe08b8d8b0efb4ef3919941"`);
        await queryRunner.query(`ALTER TABLE "notification_entity" DROP CONSTRAINT "FK_306a10824978602f6e7647df42d"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "lastActiveAt"`);
        await queryRunner.query(`ALTER TABLE "user_entity" DROP COLUMN "createdAt"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0bcbd23ad8ee331728ba6f9a3d"`);
        await queryRunner.query(`DROP TABLE "notification_entity"`);
        await queryRunner.query(`DROP TYPE "public"."notification_entity_type_enum"`);
    }

}
