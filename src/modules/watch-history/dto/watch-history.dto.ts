import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class SaveProgressDto {
  @IsUUID()
  videoId: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  watchedSeconds: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  completed?: boolean;
}

export class UpdateProgressDto {
  @IsInt()
  @Min(0)
  @Type(() => Number)
  watchedSeconds: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  completed?: boolean;
}
