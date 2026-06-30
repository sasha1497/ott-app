import { Inject, Injectable } from '@nestjs/common';
import { Pool, QueryResult, QueryResultRow } from 'pg';
import { PG_POOL } from './database/pg-pool.token';

@Injectable()
export class DbService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async query<T extends QueryResultRow = any>(
    text: string,
    params: any[] = [],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  /** Run multiple statements inside a single transaction. */
  async transaction<T>(
    callback: (client: import('pg').PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
