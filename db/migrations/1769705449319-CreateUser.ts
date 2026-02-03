import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUser1769705449319 implements MigrationInterface {
  name = 'CreateUser1769705449319';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "user_entity" (
            "id" SERIAL NOT NULL, 
            "email" character varying NOT NULL, 
            "password" character varying NOT NULL, 
            "username" character varying, 
            "isPrivate" boolean NOT NULL DEFAULT true, 
            "state" character varying NOT NULL DEFAULT 'init', 
            CONSTRAINT "UQ_415c35b9b3b6fe45a3b065030f5" UNIQUE ("email"), 
            CONSTRAINT "UQ_9b998bada7cff93fcb953b0c37e" UNIQUE ("username"), 
            CONSTRAINT "PK_b54f8ea623b17094db7667d8206" PRIMARY KEY ("id")
        )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_entity"`);
  }
}
