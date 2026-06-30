import { Injectable, NotFoundException } from '@nestjs/common';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { VideosRepository } from './videos.repository';

@Injectable()
export class VideoStreamService {
  constructor(private readonly videosRepository: VideosRepository) {}

  async stream(videoId: string, req: Request, res: Response) {
    const video = await this.videosRepository.findById(videoId);
    if (!video || !video.video_url) {
      throw new NotFoundException('Video not found or has no media file');
    }

    // video_url is stored as a path relative to the project root, e.g. /uploads/videos/xyz.mp4
    const relativePath = video.video_url.replace(/^\//, '');
    const filePath = path.join(process.cwd(), relativePath);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Video file not found on server');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (!range) {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    });

    fs.createReadStream(filePath, { start, end }).pipe(res);
  }
}
