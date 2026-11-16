import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import { createPool, Pool } from 'mysql2/promise';

type RequiredDatabaseConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

function requiredEnvironmentValue(name: string) {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(`Missing database configuration: ${name}`);
  }
  return value;
}

function getDatabaseConfig(): RequiredDatabaseConfig {
  const portValue = process.env.DB_PORT;
  const port = portValue === undefined ? 3306 : Number(portValue);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT must be a valid TCP port');
  }

  return {
    host: requiredEnvironmentValue('DB_HOST'),
    port,
    user: requiredEnvironmentValue('DB_USER'),
    password: requiredEnvironmentValue('DB_PASSWORD'),
    database: requiredEnvironmentValue('DB_NAME'),
  };
}

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  readonly db: MySql2Database;
  private readonly pool: Pool;

  constructor() {
    this.pool = createPool({
      ...getDatabaseConfig(),
      connectionLimit: 10,
    });
    this.db = drizzle({ client: this.pool });
  }

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
