import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface FavoriteRow {
  id: string;
  user_id: string;
  video_id: string;
  created_at: Date;
}

@Injectable()
export class FavoritesRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAllForUser(userId: string) {
    const result = await this.db.query(
      `SELECT f.id, f.created_at, v.*
       FROM favorites f
       JOIN videos v ON v.id = f.video_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId],
    );
    return result.rows;
  }

  async exists(userId: string, videoId: string): Promise<boolean> {
    const result = await this.db.query(
      `SELECT 1 FROM favorites WHERE user_id = $1 AND video_id = $2`,
      [userId, videoId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async add(userId: string, videoId: string): Promise<FavoriteRow> {
    const result = await this.db.query<FavoriteRow>(
      `INSERT INTO favorites (user_id, video_id) VALUES ($1, $2) RETURNING *`,
      [userId, videoId],
    );
    return result.rows[0];
  }

  async remove(userId: string, videoId: string): Promise<void> {
    await this.db.query(
      `DELETE FROM favorites WHERE user_id = $1 AND video_id = $2`,
      [userId, videoId],
    );
  }
}
