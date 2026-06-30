import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  created_at: Date;
}

@Injectable()
export class CategoriesRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<CategoryRow[]> {
    const result = await this.db.query<CategoryRow>(
      `SELECT * FROM categories ORDER BY name ASC`,
    );
    return result.rows;
  }

  async findById(id: string): Promise<CategoryRow | null> {
    const result = await this.db.query<CategoryRow>(
      `SELECT * FROM categories WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async create(name: string, description?: string): Promise<CategoryRow> {
    const result = await this.db.query<CategoryRow>(
      `INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *`,
      [name, description ?? null],
    );
    return result.rows[0];
  }

  async update(
    id: string,
    data: { name?: string; description?: string },
  ): Promise<CategoryRow | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(data.description);
    }
    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const result = await this.db.query<CategoryRow>(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );
    return result.rows[0] ?? null;
  }

  async delete(id: string): Promise<void> {
    await this.db.query(`DELETE FROM categories WHERE id = $1`, [id]);
  }
}
