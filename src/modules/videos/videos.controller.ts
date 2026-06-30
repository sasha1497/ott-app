import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  imageFileFilter,
  makeDiskStorage,
  videoFileFilter,
} from '../../common/utils/file-storage.util';
import { VideosService } from './videos.service';
import { VideoStreamService } from './video-stream.service';
import {
  CreateVideoDto,
  UpdateVideoDto,
  VideoListQueryDto,
  VideoSearchQueryDto,
} from './dto/video.dto';

@Controller('videos')
export class VideosController {
  constructor(
    private readonly videosService: VideosService,
    private readonly videoStreamService: VideoStreamService,
  ) {}

  @Public()
  @Get()
  findAll(@Query() query: VideoListQueryDto) {
    return this.videosService.findAll(query);
  }

  @Public()
  @Get('featured')
  findFeatured(@Query('limit') limit?: number) {
    return this.videosService.findFeatured(limit ? Number(limit) : 10);
  }

  @Public()
  @Get('latest')
  findLatest(@Query('limit') limit?: number) {
    return this.videosService.findLatest(limit ? Number(limit) : 10);
  }

  @Public()
  @Get('popular')
  findPopular(@Query('limit') limit?: number) {
    return this.videosService.findPopular(limit ? Number(limit) : 10);
  }

  @Public()
  @Get('search')
  search(@Query() query: VideoSearchQueryDto) {
    return this.videosService.search(query);
  }

  @Public()
  @Get('category/:id')
  findByCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.videosService.findByCategory(
      id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Public()
  @Get('stream/:id')
  async stream(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.videoStreamService.stream(id, req, res);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.videosService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateVideoDto) {
    return this.videosService.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVideoDto) {
    return this.videosService.update(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.videosService.remove(id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('video', {
      storage: makeDiskStorage('videos'),
      fileFilter: videoFileFilter,
      limits: { fileSize: 2048 * 1024 * 1024 },
    }),
  )
  uploadVideo(
    @Body('videoId') videoId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.videosService.setVideoFile(
      videoId,
      `/uploads/videos/${file.filename}`,
    );
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('thumbnail')
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      storage: makeDiskStorage('thumbnails'),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadThumbnail(
    @Body('videoId') videoId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.videosService.setThumbnail(
      videoId,
      `/uploads/thumbnails/${file.filename}`,
    );
  }
}
