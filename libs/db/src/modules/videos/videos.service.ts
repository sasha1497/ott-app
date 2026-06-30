import { Injectable, NotFoundException } from '@nestjs/common';
import { VideosRepository } from './videos.repository';
import {
  CreateVideoDto,
  UpdateVideoDto,
  VideoListQueryDto,
  VideoSearchQueryDto,
} from './dto/video.dto';
import { buildPaginationMeta } from '../../common/dto/pagination-query.dto';

@Injectable()
export class VideosService {
  constructor(private readonly videosRepository: VideosRepository) {}

  async findAll(query: VideoListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { rows, total } = await this.videosRepository.findAll({
      limit,
      offset: (page - 1) * limit,
      sortBy: query.sortBy ?? 'created_at',
      sortOrder: query.sortOrder ?? 'desc',
      categoryId: query.categoryId,
      language: query.language,
      onlyPublished: true,
    });
    return { items: rows, meta: buildPaginationMeta(total, page, limit) };
  }

  async findOne(id: string) {
    const video = await this.videosRepository.findById(id);
    if (!video) throw new NotFoundException('Video not found');
    return video;
  }

  findFeatured(limit = 10) {
    return this.videosRepository.findFeatured(limit);
  }

  findLatest(limit = 10) {
    return this.videosRepository.findLatest(limit);
  }

  findPopular(limit = 10) {
    return this.videosRepository.findPopular(limit);
  }

  async search(query: VideoSearchQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { rows, total } = await this.videosRepository.search({
      query: query.q,
      limit,
      offset: (page - 1) * limit,
    });
    return { items: rows, meta: buildPaginationMeta(total, page, limit) };
  }

  async findByCategory(categoryId: string, page = 1, limit = 20) {
    const { rows, total } = await this.videosRepository.findByCategory(
      categoryId,
      limit,
      (page - 1) * limit,
    );
    return { items: rows, meta: buildPaginationMeta(total, page, limit) };
  }

  create(dto: CreateVideoDto) {
    return this.videosRepository.create(dto);
  }

  async update(id: string, dto: UpdateVideoDto) {
    await this.findOne(id);
    return this.videosRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.videosRepository.delete(id);
    return { message: 'Video deleted successfully' };
  }

  async setVideoFile(id: string, videoUrl: string) {
    await this.findOne(id);
    return this.videosRepository.update(id, { videoUrl });
  }

  async setThumbnail(id: string, thumbnail: string) {
    await this.findOne(id);
    return this.videosRepository.update(id, { thumbnail });
  }
}
