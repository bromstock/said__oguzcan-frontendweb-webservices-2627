import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { CreateCategoryDto } from './create-category.dto';
import { DatabaseService } from '../database/database.service';
import { categories, components } from '../database/schema';

@Injectable()
export class CategoriesService {
  constructor(private readonly database: DatabaseService) {}

  findAll() {
    return this.database.db.select().from(categories);
  }

  async create(dto: CreateCategoryDto) {
    if (!dto || typeof dto.name !== 'string' || dto.name.trim().length === 0) {
      throw new BadRequestException('Category name is required');
    }
    if (dto.description !== undefined && typeof dto.description !== 'string') {
      throw new BadRequestException('Category description must be a string');
    }

    const [inserted] = await this.database.db
      .insert(categories)
      .values(dto)
      .$returningId();
    const [category] = await this.database.db
      .select()
      .from(categories)
      .where(eq(categories.category_id, inserted.category_id));
    return category;
  }

  async findComponents(categoryId: number) {
    const [category] = await this.database.db
      .select()
      .from(categories)
      .where(eq(categories.category_id, categoryId));
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const results = await this.database.db
      .select({ component: components })
      .from(components)
      .where(eq(components.category_id, categoryId));
    return results.map(({ component }) => ({ ...component, category }));
  }
}
