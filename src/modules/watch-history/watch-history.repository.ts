import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface WatchHistoryRow {
  id: string;
  user_id: string;
  video_id: string;
  watched_seconds: number;
  completed: boolean;
  last_watched: Date;
}

@Injectable()
export class WatchHistoryRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAllForUser(userId: string) {
    const result = await this.db.query(
      `SELECT wh.*, v.title, v.thumbnail, v.duration
       FROM watch_history wh
       JOIN videos v ON v.id = wh.video_id
       WHERE wh.user_id = $1
       ORDER BY wh.last_watched DESC`,
      [userId],
    );
    return result.rows;
  }

  async findOne(userId: string, videoId: string): Promise<WatchHistoryRow | null> {
    const result = await this.db.query<WatchHistoryRow>(
      `SELECT * FROM watch_history WHERE user_id = $1 AND video_id = $2`,
      [userId, videoId],
    );
    return result.rows[0] ?? null;
  }

  /** Upsert: insert a new progress row, or update if one already exists for this user/video. */
  async upsert(
    userId: string,
    videoId: string,
    watchedSeconds: number,
    completed = false,
  ): Promise<WatchHistoryRow> {
    const existing = await this.findOne(userId, videoId);
    if (existing) {
      const result = await this.db.query<WatchHistoryRow>(
        `UPDATE watch_history
         SET watched_seconds = $1, completed = $2, last_watched = NOW()
         WHERE id = $3 RETURNING *`,
        [watchedSeconds, completed, existing.id],
      );
      return result.rows[0];
    }

    const result = await this.db.query<WatchHistoryRow>(
      `INSERT INTO watch_history (user_id, video_id, watched_seconds, completed)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, videoId, watchedSeconds, completed],
    );
    return result.rows[0];
  }

  async clearForUser(userId: string): Promise<void> {
    await this.db.query(`DELETE FROM watch_history WHERE user_id = $1`, [
      userId,
    ]);
  }
}
