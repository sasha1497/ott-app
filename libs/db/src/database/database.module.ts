import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { DatabaseService } from './database.service';
import { PG_POOL } from './pg-pool.token';

export { PG_POOL };

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const pool = new Pool({
          host: config.get<string>('database.host'),
          port: config.get<number>('database.port'),
          database: config.get<string>('database.name'),
          user: config.get<string>('database.user'),
          password: config.get<string>('database.password'),
          ssl: config.get<boolean>('database.ssl')
            ? { rejectUnauthorized: false }
            : false,
          max: config.get<number>('database.poolMax'),
        });

        pool.on('error', (err) => {
          // eslint-disable-next-line no-console
          console.error('Unexpected PG pool error', err);
        });

        return pool;
      },
    },
    DatabaseService,
  ],
  exports: [PG_POOL, DatabaseService],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor() {}

  async onModuleDestroy() {
    // Pool cleanup handled per-instance via Nest's DI lifecycle if needed.
  }
}
