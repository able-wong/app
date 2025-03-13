import { DataSource } from 'typeorm';
import * as entities from './entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  synchronize: true,
  logging: false,
  entities: Object.values(entities),
  migrations: ['src/migration/**/*.ts'],
  subscribers: [
    // specify your subscribers here
  ],
});
