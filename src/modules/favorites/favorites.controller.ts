import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.favoritesService.findAll(user.sub);
  }

  @Post(':videoId')
  add(
    @CurrentUser() user: JwtPayload,
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    return this.favoritesService.add(user.sub, videoId);
  }

  @Delete(':videoId')
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    return this.favoritesService.remove(user.sub, videoId);
  }
}
