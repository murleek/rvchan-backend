import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTreeInPost1778948949194 implements MigrationInterface {
  name = 'AddTreeInPost1778948949194';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_entity" DROP CONSTRAINT "FK_818b1ea228a8ba78dea46e29158"`,
    );
    await queryRunner.query(
      `CREATE TABLE "post_entity_closure" ("id_ancestor" integer NOT NULL, "id_descendant" integer NOT NULL, CONSTRAINT "PK_76904c22df5f352737d5a0e7399" PRIMARY KEY ("id_ancestor", "id_descendant"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c33a3508372db1961060d43455" ON "post_entity_closure" ("id_ancestor") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_34b06b20f658e6b1cdb871263f" ON "post_entity_closure" ("id_descendant") `,
    );
    await queryRunner.query(
      `ALTER TABLE "post_entity" ADD "type" character varying NOT NULL DEFAULT 'thread'`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_entity" ADD CONSTRAINT "FK_818b1ea228a8ba78dea46e29158" FOREIGN KEY ("parentId") REFERENCES "post_entity"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_entity_closure" ADD CONSTRAINT "FK_c33a3508372db1961060d434554" FOREIGN KEY ("id_ancestor") REFERENCES "post_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_entity_closure" ADD CONSTRAINT "FK_34b06b20f658e6b1cdb871263f7" FOREIGN KEY ("id_descendant") REFERENCES "post_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_entity_closure" DROP CONSTRAINT "FK_34b06b20f658e6b1cdb871263f7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_entity_closure" DROP CONSTRAINT "FK_c33a3508372db1961060d434554"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_entity" DROP CONSTRAINT "FK_818b1ea228a8ba78dea46e29158"`,
    );
    await queryRunner.query(`ALTER TABLE "post_entity" DROP COLUMN "type"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_34b06b20f658e6b1cdb871263f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c33a3508372db1961060d43455"`,
    );
    await queryRunner.query(`DROP TABLE "post_entity_closure"`);
    await queryRunner.query(
      `ALTER TABLE "post_entity" ADD CONSTRAINT "FK_818b1ea228a8ba78dea46e29158" FOREIGN KEY ("parentId") REFERENCES "post_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
