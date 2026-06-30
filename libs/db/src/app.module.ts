import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { join } from 'path';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { VideosModule } from './modules/videos/videos.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { WatchHistoryModule } from './modules/watch-history/watch-history.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env'],
    }),
    // Serves /uploads/** as static files (thumbnails, profile images).
    // Video streaming itself goes through the dedicated range-request controller,
    // not this static server, so large files are served with proper 206 support.
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      exclude: ['/uploads/videos/(.*)'],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    VideosModule,
    FavoritesModule,
    WatchHistoryModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
