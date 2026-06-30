import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import * as fs from 'fs';

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function makeDiskStorage(subDir: string) {
  const dest = `uploads/${subDir}`;
  ensureDir(dest);
  return diskStorage({
    destination: dest,
    filename: (_req, file, cb) => {
      const unique = randomUUID();
      cb(null, `${unique}${extname(file.originalname)}`);
    },
  });
}

export const imageFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.mimetype.match(/^image\/(jpg|jpeg|png|webp|gif)$/)) {
    return cb(
      new BadRequestException('Only image files are allowed (jpg, png, webp, gif)'),
      false,
    );
  }
  cb(null, true);
};

export const videoFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.mimetype.match(/^video\/(mp4|mpeg|webm|quicktime|x-matroska)$/)) {
    return cb(
      new BadRequestException('Only video files are allowed (mp4, mpeg, webm, mov, mkv)'),
      false,
    );
  }
  cb(null, true);
};
