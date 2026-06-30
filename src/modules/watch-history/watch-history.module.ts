import { Module } from '@nestjs/common';
import { WatchHistoryController } from './watch-history.controller';
import { WatchHistoryService } from './watch-history.service';
import { WatchHistoryRepository } from './watch-history.repository';
import { VideosModule } from '../videos/videos.module';

@Module({
  imports: [VideosModule],
  controllers: [WatchHistoryController],
  providers: [WatchHistoryService, WatchHistoryRepository],
})
export class WatchHistoryModule {}
