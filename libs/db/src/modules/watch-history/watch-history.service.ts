import { Injectable, NotFoundException } from '@nestjs/common';
import { WatchHistoryRepository } from './watch-history.repository';
import { VideosRepository } from '../videos/videos.repository';
import { SaveProgressDto, UpdateProgressDto } from './dto/watch-history.dto';

@Injectable()
export class WatchHistoryService {
  constructor(
    private readonly watchHistoryRepository: WatchHistoryRepository,
    private readonly videosRepository: VideosRepository,
  ) {}

  findAll(userId: string) {
    return this.watchHistoryRepository.findAllForUser(userId);
  }

  async saveProgress(userId: string, dto: SaveProgressDto) {
    const video = await this.videosRepository.findById(dto.videoId);
    if (!video) throw new NotFoundException('Video not found');
    return this.watchHistoryRepository.upsert(
      userId,
      dto.videoId,
      dto.watchedSeconds,
      dto.completed ?? false,
    );
  }

  async updateProgress(userId: string, videoId: string, dto: UpdateProgressDto) {
    const video = await this.videosRepository.findById(videoId);
    if (!video) throw new NotFoundException('Video not found');
    return this.watchHistoryRepository.upsert(
      userId,
      videoId,
      dto.watchedSeconds,
      dto.completed ?? false,
    );
  }

  async clear(userId: string) {
    await this.watchHistoryRepository.clearForUser(userId);
    return { message: 'Watch history cleared' };
  }
}
