import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface RefreshTokenRow {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

@Injectable()
export class RefreshTokensRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshTokenRow> {
    const result = await this.db.query<RefreshTokenRow>(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, token, expiresAt],
    );
    return result.rows[0];
  }

  async findByToken(token: string): Promise<RefreshTokenRow | null> {
    const result = await this.db.query<RefreshTokenRow>(
      `SELECT * FROM refresh_tokens WHERE token = $1`,
      [token],
    );
    return result.rows[0] ?? null;
  }

  async deleteByToken(token: string): Promise<void> {
    await this.db.query(`DELETE FROM refresh_tokens WHERE token = $1`, [
      token,
    ]);
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.db.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [
      userId,
    ]);
  }

  async deleteExpired(): Promise<void> {
    await this.db.query(`DELETE FROM refresh_tokens WHERE expires_at < NOW()`);
  }
}
