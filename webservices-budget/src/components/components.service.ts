import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateComponentDto } from './create-component.dto';
import { InMemoryStore } from '../in-memory-store';

@Injectable()
export class ComponentsService {
  constructor(private readonly store: InMemoryStore) {}

  findAll() {
    return this.store.components.map((component) =>
      this.withCategory(component),
    );
  }

  findOne(componentId: number) {
    const component = this.store.components.find(
      (item) => item.component_id === componentId,
    );
    if (!component) {
      throw new NotFoundException('Component not found');
    }
    return this.withCategory(component);
  }

  create(dto: CreateComponentDto) {
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
    if (
      dto.category_id !== undefined &&
      !this.store.categories.some(
        (category) => category.category_id === dto.category_id,
      )
    ) {
      throw new BadRequestException('The specified category does not exist');
    }

    return this.withCategory(this.store.createComponent(dto));
  }

  findByCategory(categoryId: number) {
    if (
      !this.store.categories.some((item) => item.category_id === categoryId)
    ) {
      throw new NotFoundException('Category not found');
    }
    return this.store.components
      .filter((component) => component.category_id === categoryId)
      .map((component) => this.withCategory(component));
  }

  // Returns a copy of the component with its category attached, or null when
  // it has no matching category.
  private withCategory(component: (typeof this.store.components)[number]) {
    const category = this.store.categories.find(
      (item) => item.category_id === component.category_id,
    );
    return {
      ...component,
      category: category ?? null,
    };
  }
}
