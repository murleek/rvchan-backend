import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshToken1769774181061 implements MigrationInterface {
  name = 'CreateRefreshToken1769774181061';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "refresh_token_entity" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
        "tokenHash" character varying NOT NULL, 
        "expiresAt" TIMESTAMP NOT NULL, 
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
        "userId" integer, 
        CONSTRAINT "PK_a78813e06745b2c5d5b9776bfcf" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(`
      ALTER TABLE "refresh_token_entity" 
        ADD CONSTRAINT "FK_ebf65cd067163c7c66baa3da1c1" FOREIGN KEY ("userId") 
          REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_token_entity" DROP CONSTRAINT "FK_ebf65cd067163c7c66baa3da1c1"`,
    );
    await queryRunner.query(`DROP TABLE "refresh_token_entity"`);
  }
}
