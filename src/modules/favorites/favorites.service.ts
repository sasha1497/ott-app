import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FavoritesRepository } from './favorites.repository';
import { VideosRepository } from '../videos/videos.repository';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly favoritesRepository: FavoritesRepository,
    private readonly videosRepository: VideosRepository,
  ) {}

  findAll(userId: string) {
    return this.favoritesRepository.findAllForUser(userId);
  }

  async add(userId: string, videoId: string) {
    const video = await this.videosRepository.findById(videoId);
    if (!video) throw new NotFoundException('Video not found');

    const exists = await this.favoritesRepository.exists(userId, videoId);
    if (exists) {
      throw new ConflictException('Video is already in your favorites');
    }

    return this.favoritesRepository.add(userId, videoId);
  }

  async remove(userId: string, videoId: string) {
    const exists = await this.favoritesRepository.exists(userId, videoId);
    if (!exists) throw new NotFoundException('Favorite not found');
    await this.favoritesRepository.remove(userId, videoId);
    return { message: 'Removed from favorites' };
  }
}
