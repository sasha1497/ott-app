import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface VideoRow {
  id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  thumbnail: string | null;
  video_url: string | null;
  duration: number | null;
  release_date: Date | null;
  language: string | null;
  age_rating: string | null;
  is_featured: boolean;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
}

const ALLOWED_SORT = new Set([
  'created_at',
  'title',
  'release_date',
  'duration',
]);

@Injectable()
export class VideosRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll(params: {
    limit: number;
    offset: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    categoryId?: string;
    language?: string;
    onlyPublished?: boolean;
  }): Promise<{ rows: VideoRow[]; total: number }> {
    const sortBy = ALLOWED_SORT.has(params.sortBy) ? params.sortBy : 'created_at';
    const sortOrder = params.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.onlyPublished) {
      conditions.push(`is_published = TRUE`);
    }
    if (params.categoryId) {
      conditions.push(`category_id = $${idx++}`);
      values.push(params.categoryId);
    }
    if (params.language) {
      conditions.push(`language = $${idx++}`);
      values.push(params.language);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(params.limit);
    const limitIdx = values.length;
    values.push(params.offset);
    const offsetIdx = values.length;

    const result = await this.db.query<VideoRow>(
      `SELECT * FROM videos ${where}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      values,
    );

    const countResult = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) FROM videos ${where}`,
      values.slice(0, idx - 1),
    );

    return { rows: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  }

  async findById(id: string): Promise<VideoRow | null> {
    const result = await this.db.query<VideoRow>(
      `SELECT * FROM videos WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async findFeatured(limit: number): Promise<VideoRow[]> {
    const result = await this.db.query<VideoRow>(
      `SELECT * FROM videos WHERE is_featured = TRUE AND is_published = TRUE
       ORDER BY created_at DESC LIMIT $1`,
      [limit],
    );
    return result.rows;
  }

  async findLatest(limit: number): Promise<VideoRow[]> {
    const result = await this.db.query<VideoRow>(
      `SELECT * FROM videos WHERE is_published = TRUE
       ORDER BY release_date DESC NULLS LAST, created_at DESC LIMIT $1`,
      [limit],
    );
    return result.rows;
  }

  /** "Popular" is derived from watch_history activity volume per video. */
  async findPopular(limit: number): Promise<VideoRow[]> {
    const result = await this.db.query<VideoRow>(
      `SELECT v.*, COUNT(wh.id) AS watch_count
       FROM videos v
       LEFT JOIN watch_history wh ON wh.video_id = v.id
       WHERE v.is_published = TRUE
       GROUP BY v.id
       ORDER BY watch_count DESC, v.created_at DESC
       LIMIT $1`,
      [limit],
    );
    return result.rows;
  }

  async search(params: {
    query: string;
    limit: number;
    offset: number;
  }): Promise<{ rows: VideoRow[]; total: number }> {
    const like = `%${params.query}%`;
    const result = await this.db.query<VideoRow>(
      `SELECT * FROM videos
       WHERE is_published = TRUE AND (title ILIKE $1 OR description ILIKE $1)
       ORDER BY title ASC
       LIMIT $2 OFFSET $3`,
      [like, params.limit, params.offset],
    );
    const countResult = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) FROM videos
       WHERE is_published = TRUE AND (title ILIKE $1 OR description ILIKE $1)`,
      [like],
    );
    return { rows: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  }

  async findByCategory(
    categoryId: string,
    limit: number,
    offset: number,
  ): Promise<{ rows: VideoRow[]; total: number }> {
    const result = await this.db.query<VideoRow>(
      `SELECT * FROM videos WHERE category_id = $1 AND is_published = TRUE
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [categoryId, limit, offset],
    );
    const countResult = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) FROM videos WHERE category_id = $1 AND is_published = TRUE`,
      [categoryId],
    );
    return { rows: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  }

  async create(data: {
    title: string;
    description?: string;
    categoryId?: string;
    thumbnail?: string;
    videoUrl?: string;
    duration?: number;
    releaseDate?: string;
    language?: string;
    ageRating?: string;
    isFeatured?: boolean;
    isPublished?: boolean;
  }): Promise<VideoRow> {
    const result = await this.db.query<VideoRow>(
      `INSERT INTO videos
        (category_id, title, description, thumbnail, video_url, duration,
         release_date, language, age_rating, is_featured, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        data.categoryId ?? null,
        data.title,
        data.description ?? null,
        data.thumbnail ?? null,
        data.videoUrl ?? null,
        data.duration ?? null,
        data.releaseDate ?? null,
        data.language ?? null,
        data.ageRating ?? null,
        data.isFeatured ?? false,
        data.isPublished ?? true,
      ],
    );
    return result.rows[0];
  }

  async update(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      categoryId: string;
      thumbnail: string;
      videoUrl: string;
      duration: number;
      releaseDate: string;
      language: string;
      ageRating: string;
      isFeatured: boolean;
      isPublished: boolean;
    }>,
  ): Promise<VideoRow | null> {
    const map: Record<string, string> = {
      title: 'title',
      description: 'description',
      categoryId: 'category_id',
      thumbnail: 'thumbnail',
      videoUrl: 'video_url',
      duration: 'duration',
      releaseDate: 'release_date',
      language: 'language',
      ageRating: 'age_rating',
      isFeatured: 'is_featured',
      isPublished: 'is_published',
    };

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, column] of Object.entries(map)) {
      if (data[key] !== undefined) {
        fields.push(`${column} = $${idx++}`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await this.db.query<VideoRow>(
      `UPDATE videos SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );
    return result.rows[0] ?? null;
  }

  async delete(id: string): Promise<void> {
    await this.db.query(`DELETE FROM videos WHERE id = $1`, [id]);
  }
}
