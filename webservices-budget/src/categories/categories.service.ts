import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './create-category.dto';
import { InMemoryStore } from '../in-memory-store';

@Injectable()
export class CategoriesService {
  constructor(private readonly store: InMemoryStore) {}

  findAll() {
    return this.store.categories;
  }

  create(dto: CreateCategoryDto) {
    if (!dto || typeof dto.name !== 'string' || dto.name.trim().length === 0) {
      throw new BadRequestException('Category name is required');
    }
    if (dto.description !== undefined && typeof dto.description !== 'string') {
      throw new BadRequestException('Category description must be a string');
    }
    return this.store.createCategory(dto);
  }

  findComponents(categoryId: number) {
    if (
      !this.store.categories.some((item) => item.category_id === categoryId)
    ) {
      throw new NotFoundException('Category not found');
    }

    return this.store.components
      .filter((component) => component.category_id === categoryId)
      .map((component) => ({
        ...component,
        category: this.store.categories.find(
          (category) => category.category_id === categoryId,
        ),
      }));
  }
}
