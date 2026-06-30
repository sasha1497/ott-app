import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { ChangePasswordDto, UpdateProfileDto } from './dto/users.dto';
import {
  imageFileFilter,
  makeDiskStorage,
} from '../../common/utils/file-storage.util';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.getMe(user.sub);
  }

  @Put('me')
  updateMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateMe(user.sub, dto);
  }

  @Post('me/profile-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: makeDiskStorage('profiles'),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadProfileImage(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.updateProfileImage(
      user.sub,
      `/uploads/profiles/${file.filename}`,
    );
  }

  @Put('change-password')
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.sub, dto);
  }

  @Delete('me')
  deleteMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.deleteMe(user.sub);
  }
}
