import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewNotificationTypes1779709067177 implements MigrationInterface {
    name = 'AddNewNotificationTypes1779709067177'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."notification_entity_type_enum" RENAME TO "notification_entity_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notification_entity_type_enum" AS ENUM('follow', 'follow_accepted', 'new_device', 'post_mention', 'post_reply', 'post_reply_to_other')`);
        await queryRunner.query(`ALTER TABLE "notification_entity" ALTER COLUMN "type" TYPE "public"."notification_entity_type_enum" USING "type"::"text"::"public"."notification_entity_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_entity_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notification_entity_type_enum_old" AS ENUM('follow', 'follow_accepted', 'new_device', 'post_mention')`);
        await queryRunner.query(`ALTER TABLE "notification_entity" ALTER COLUMN "type" TYPE "public"."notification_entity_type_enum_old" USING "type"::"text"::"public"."notification_entity_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notification_entity_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notification_entity_type_enum_old" RENAME TO "notification_entity_type_enum"`);
    }

}
