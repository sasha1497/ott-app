import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { MailerService } from './mailer.service';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import { VerificationTokensRepository } from './verification-tokens.repository';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.accessSecret') ?? 'access_secret',
        signOptions: {
          expiresIn: (config.get<string>('jwt.accessExpiresIn') ??
            '15m') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    MailerService,
    RefreshTokensRepository,
    VerificationTokensRepository,
  ],
  exports: [AuthService],
})
export class AuthModule {}
