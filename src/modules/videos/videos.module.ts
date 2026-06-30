import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { VideosRepository } from './videos.repository';
import { VideoStreamService } from './video-stream.service';

@Module({
  controllers: [VideosController],
  providers: [VideosService, VideosRepository, VideoStreamService],
  exports: [VideosRepository],
})
export class VideosModule {}
