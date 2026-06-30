import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { WatchHistoryService } from './watch-history.service';
import { SaveProgressDto, UpdateProgressDto } from './dto/watch-history.dto';

@Controller('watch-history')
export class WatchHistoryController {
  constructor(private readonly watchHistoryService: WatchHistoryService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.watchHistoryService.findAll(user.sub);
  }

  @HttpCode(HttpStatus.OK)
  @Post()
  saveProgress(@CurrentUser() user: JwtPayload, @Body() dto: SaveProgressDto) {
    return this.watchHistoryService.saveProgress(user.sub, dto);
  }

  @Delete('clear')
  clear(@CurrentUser() user: JwtPayload) {
    return this.watchHistoryService.clear(user.sub);
  }

  @Put(':videoId')
  updateProgress(
    @CurrentUser() user: JwtPayload,
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.watchHistoryService.updateProgress(user.sub, videoId, dto);
  }
}
