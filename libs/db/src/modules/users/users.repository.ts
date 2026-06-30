import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { UserRow } from './user.types';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  async findById(id: string): Promise<UserRow | null> {
    const result = await this.db.query<UserRow>(
      `SELECT * FROM users WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async findByEmail(email: string): Promise<UserRow | null> {
    const result = await this.db.query<UserRow>(
      `SELECT * FROM users WHERE email = $1`,
      [email.toLowerCase()],
    );
    return result.rows[0] ?? null;
  }

  async create(data: {
    firstName: string;
    lastName?: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<UserRow> {
    const result = await this.db.query<UserRow>(
      `INSERT INTO users (first_name, last_name, email, password, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.firstName,
        data.lastName ?? null,
        data.email.toLowerCase(),
        data.password,
        data.phone ?? null,
      ],
    );
    return result.rows[0];
  }

  async updateProfile(
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      profileImage: string;
    }>,
  ): Promise<UserRow | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.firstName !== undefined) {
      fields.push(`first_name = $${idx++}`);
      values.push(data.firstName);
    }
    if (data.lastName !== undefined) {
      fields.push(`last_name = $${idx++}`);
      values.push(data.lastName);
    }
    if (data.phone !== undefined) {
      fields.push(`phone = $${idx++}`);
      values.push(data.phone);
    }
    if (data.profileImage !== undefined) {
      fields.push(`profile_image = $${idx++}`);
      values.push(data.profileImage);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await this.db.query<UserRow>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );
    return result.rows[0] ?? null;
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.db.query(
      `UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2`,
      [hashedPassword, id],
    );
  }

  async setEmailVerified(id: string): Promise<void> {
    await this.db.query(
      `UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1`,
      [id],
    );
  }

  async setStatus(id: string, status: boolean): Promise<void> {
    await this.db.query(
      `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, id],
    );
  }

  async setRole(id: string, role: 'USER' | 'ADMIN'): Promise<void> {
    await this.db.query(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2`,
      [role, id],
    );
  }

  async deleteById(id: string): Promise<void> {
    await this.db.query(`DELETE FROM users WHERE id = $1`, [id]);
  }

  async findAll(params: {
    limit: number;
    offset: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    search?: string;
  }): Promise<{ rows: UserRow[]; total: number }> {
    const allowedSort = new Set([
      'created_at',
      'first_name',
      'email',
      'status',
    ]);
    const sortBy = allowedSort.has(params.sortBy)
      ? params.sortBy
      : 'created_at';
    const sortOrder = params.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const values: any[] = [];
    let where = '';
    if (params.search) {
      values.push(`%${params.search}%`);
      where = `WHERE first_name ILIKE $${values.length} OR last_name ILIKE $${values.length} OR email ILIKE $${values.length}`;
    }

    values.push(params.limit);
    const limitIdx = values.length;
    values.push(params.offset);
    const offsetIdx = values.length;

    const result = await this.db.query<UserRow>(
      `SELECT * FROM users ${where}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      values,
    );

    const countValues = params.search ? [`%${params.search}%`] : [];
    const countWhere = params.search
      ? `WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1`
      : '';
    const countResult = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) FROM users ${countWhere}`,
      countValues,
    );

    return {
      rows: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }
}
