import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { BuildsController } from './builds/builds.controller';
import { UsersController } from './users/users.controller';
import { ComponentsController } from './components/components.controller';
import { BuildsService } from './builds/builds.service';
import { CategoriesService } from './categories/categories.service';
import { UsersService } from './users/users.service';
import { ComponentsService } from './components/components.service';
import { CategoriesController } from './categories/categories.controller';
import { InMemoryStore } from './in-memory-store';

@Module({
  imports: [],
  controllers: [
    AppController,
    HealthController,
    BuildsController,
    UsersController,
    ComponentsController,
    CategoriesController,
  ],
  providers: [
    AppService,
    InMemoryStore,
    BuildsService,
    ComponentsService,
    UsersService,
    CategoriesService,
  ],
})
export class AppModule {}
