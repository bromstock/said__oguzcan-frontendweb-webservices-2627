import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { CreateComponentDto } from './create-component.dto';
import { DatabaseService } from '../database/database.service';
import { categories, components } from '../database/schema';

@Injectable()
export class ComponentsService {
  constructor(private readonly database: DatabaseService) {}

  async findAll() {
    const results = await this.database.db
      .select({ component: components, category: categories })
      .from(components)
      .leftJoin(categories, eq(components.category_id, categories.category_id));
    return results.map(({ component, category }) => ({
      ...component,
      category,
    }));
  }

  async findOne(componentId: number) {
    const [result] = await this.database.db
      .select({ component: components, category: categories })
      .from(components)
      .leftJoin(categories, eq(components.category_id, categories.category_id))
      .where(eq(components.component_id, componentId));
    if (!result) {
      throw new NotFoundException('Component not found');
    }
    return { ...result.component, category: result.category };
  }

  async create(dto: CreateComponentDto) {
    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('A request body is required');
    }
    if (
      dto.name !== undefined &&
      (typeof dto.name !== 'string' || dto.name.trim().length === 0)
    ) {
      throw new BadRequestException('Component name cannot be empty');
    }
    const textFields = [
      'manufacturer',
      'form_factor',
      'description',
      'detail',
    ] as const;
    for (const field of textFields) {
      if (dto[field] !== undefined && typeof dto[field] !== 'string') {
        throw new BadRequestException(`${field} must be a string`);
      }
    }
    const numberFields = [
      'tdp_watts',
      'storage',
      'ram',
      'speed',
      'case_volume',
      'noise_level_db',
      'price',
    ] as const;
    for (const field of numberFields) {
      const value = dto[field];
      if (
        value !== undefined &&
        (typeof value !== 'number' || !Number.isFinite(value))
      ) {
        throw new BadRequestException(`${field} must be a number`);
      }
    }
    if (dto.category_id !== undefined && !Number.isInteger(dto.category_id)) {
      throw new BadRequestException('Category ID must be an integer');
    }
    if (dto.category_id !== undefined) {
      const [category] = await this.database.db
        .select({ category_id: categories.category_id })
        .from(categories)
        .where(eq(categories.category_id, dto.category_id));
      if (!category) {
        throw new BadRequestException('The specified category does not exist');
      }
    }

    const [inserted] = await this.database.db
      .insert(components)
      .values(dto)
      .$returningId();
    return this.findOne(inserted.component_id);
  }

  async findByCategory(categoryId: number) {
    const [category] = await this.database.db
      .select({ category_id: categories.category_id })
      .from(categories)
      .where(eq(categories.category_id, categoryId));
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.database.db
      .select({ component: components, category: categories })
      .from(components)
      .leftJoin(categories, eq(components.category_id, categories.category_id))
      .where(eq(components.category_id, categoryId))
      .then((results) =>
        results.map(({ component, category }) => ({
          ...component,
          category,
        })),
      );
  }
}
