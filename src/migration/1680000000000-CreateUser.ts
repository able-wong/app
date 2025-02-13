import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUser1680000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE user (
        id INT AUTO_INCREMENT NOT NULL,
        firstName VARCHAR(255) NOT NULL,
        lastName VARCHAR(255) NOT NULL,
        age INT NOT NULL,
        PRIMARY KEY (id)
      )
    `);

    await queryRunner.query(`
      INSERT INTO user (firstName, lastName, age) VALUES
      ('John', 'Doe', 30),
      ('Jane', 'Smith', 25),
      ('Alice', 'Johnson', 28)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE user');
  }
}
