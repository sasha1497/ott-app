import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface VerificationTokenRow {
  id: string;
  user_id: string;
  token: string;
  type: 'EMAIL_VERIFY' | 'PASSWORD_RESET';
  expires_at: Date;
  created_at: Date;
}

@Injectable()
export class VerificationTokensRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(
    userId: string,
    token: string,
    type: 'EMAIL_VERIFY' | 'PASSWORD_RESET',
    expiresAt: Date,
  ): Promise<VerificationTokenRow> {
    const result = await this.db.query<VerificationTokenRow>(
      `INSERT INTO verification_tokens (user_id, token, type, expires_at)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, token, type, expiresAt],
    );
    return result.rows[0];
  }

  async findValidToken(
    token: string,
    type: 'EMAIL_VERIFY' | 'PASSWORD_RESET',
  ): Promise<VerificationTokenRow | null> {
    const result = await this.db.query<VerificationTokenRow>(
      `SELECT * FROM verification_tokens
       WHERE token = $1 AND type = $2 AND expires_at > NOW()`,
      [token, type],
    );
    return result.rows[0] ?? null;
  }

  async deleteByToken(token: string): Promise<void> {
    await this.db.query(`DELETE FROM verification_tokens WHERE token = $1`, [
      token,
    ]);
  }

  async deleteAllForUser(
    userId: string,
    type: 'EMAIL_VERIFY' | 'PASSWORD_RESET',
  ): Promise<void> {
    await this.db.query(
      `DELETE FROM verification_tokens WHERE user_id = $1 AND type = $2`,
      [userId, type],
    );
  }
}
