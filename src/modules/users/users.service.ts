import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from './users.repository';
import { toSafeUser } from './user.types';
import { ChangePasswordDto, UpdateProfileDto } from './dto/users.dto';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  async getMe(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return toSafeUser(user);
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    const updated = await this.usersRepository.updateProfile(userId, dto);
    if (!updated) throw new NotFoundException('User not found');
    return toSafeUser(updated);
  }

  async updateProfileImage(userId: string, imagePath: string) {
    const updated = await this.usersRepository.updateProfile(userId, {
      profileImage: imagePath,
    });
    if (!updated) throw new NotFoundException('User not found');
    return toSafeUser(updated);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const matches = await bcrypt.compare(dto.currentPassword, user.password);
    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const saltRounds = this.config.get<number>('bcrypt.saltRounds') ?? 10;
    const hashed = await bcrypt.hash(dto.newPassword, saltRounds);
    await this.usersRepository.updatePassword(userId, hashed);

    return { message: 'Password changed successfully' };
  }

  async deleteMe(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    await this.usersRepository.deleteById(userId);
    return { message: 'Account deleted successfully' };
  }
}
