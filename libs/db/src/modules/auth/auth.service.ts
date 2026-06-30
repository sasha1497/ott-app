import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { UsersRepository } from '../users/users.repository';
import { toSafeUser } from '../users/user.types';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import { VerificationTokensRepository } from './verification-tokens.repository';
import { MailerService } from './mailer.service';
import {
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto';

function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return 15 * 60 * 1000; // default 15m
  const value = parseInt(match[1], 10);
  const unit = match[2] as 's' | 'm' | 'h' | 'd';
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return value * unitMs;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly verificationTokensRepository: VerificationTokensRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailer: MailerService,
  ) {}

  private async issueTokens(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessSecret =
      this.config.get<string>('jwt.accessSecret') ?? 'access_secret';
    const accessExpiresIn = (this.config.get<string>('jwt.accessExpiresIn') ??
      '15m') as JwtSignOptions['expiresIn'];
    const refreshSecret =
      this.config.get<string>('jwt.refreshSecret') ?? 'refresh_secret';
    const refreshExpiresIn =
      this.config.get<string>('jwt.refreshExpiresIn') ?? '30d';

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: accessExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn as JwtSignOptions['expiresIn'],
    });

    const expiresAt = new Date(Date.now() + parseDurationToMs(refreshExpiresIn));
    await this.refreshTokensRepository.create(user.id, refreshToken, expiresAt);

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const saltRounds = this.config.get<number>('bcrypt.saltRounds') ?? 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.usersRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: hashedPassword,
      phone: dto.phone,
    });

    // Issue an email verification token (24h validity).
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.verificationTokensRepository.create(
      user.id,
      token,
      'EMAIL_VERIFY',
      expiresAt,
    );
    await this.mailer.sendVerificationEmail(user.email, token);

    const tokens = await this.issueTokens(user);

    return {
      user: toSafeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.status) {
      throw new UnauthorizedException('Your account has been blocked');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokens(user);

    return {
      user: toSafeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const stored = await this.refreshTokensRepository.findByToken(refreshToken);
    if (!stored) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }
    if (new Date(stored.expires_at) < new Date()) {
      await this.refreshTokensRepository.deleteByToken(refreshToken);
      throw new UnauthorizedException('Refresh token has expired');
    }

    const user = await this.usersRepository.findById(payload.sub);
    if (!user || !user.status) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    // Rotate refresh token: delete old, issue new pair.
    await this.refreshTokensRepository.deleteByToken(refreshToken);
    const tokens = await this.issueTokens(user);

    return tokens;
  }

  async logout(refreshToken: string) {
    await this.refreshTokensRepository.deleteByToken(refreshToken);
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    // Always respond the same way to avoid leaking which emails are registered.
    if (!user) {
      return {
        message:
          'If an account with that email exists, a password reset link has been sent',
      };
    }

    await this.verificationTokensRepository.deleteAllForUser(
      user.id,
      'PASSWORD_RESET',
    );
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.verificationTokensRepository.create(
      user.id,
      token,
      'PASSWORD_RESET',
      expiresAt,
    );
    await this.mailer.sendPasswordResetEmail(user.email, token);

    return {
      message:
        'If an account with that email exists, a password reset link has been sent',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.verificationTokensRepository.findValidToken(
      dto.token,
      'PASSWORD_RESET',
    );
    if (!record) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const saltRounds = this.config.get<number>('bcrypt.saltRounds') ?? 10;
    const hashedPassword = await bcrypt.hash(dto.newPassword, saltRounds);
    await this.usersRepository.updatePassword(record.user_id, hashedPassword);
    await this.verificationTokensRepository.deleteByToken(dto.token);
    await this.refreshTokensRepository.deleteAllForUser(record.user_id);

    return { message: 'Password reset successfully. Please log in again.' };
  }

  async verifyEmail(token: string) {
    const record = await this.verificationTokensRepository.findValidToken(
      token,
      'EMAIL_VERIFY',
    );
    if (!record) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.usersRepository.setEmailVerified(record.user_id);
    await this.verificationTokensRepository.deleteByToken(token);

    return { message: 'Email verified successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return toSafeUser(user);
  }
}
