import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CreateCategoryDto } from './create-category.dto';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  getCategories() {
    return this.categoriesService.findAll();
  }

  @Get(':categoriesId/components')
  getCategoryComponents(
    @Param('categoriesId', ParseIntPipe) categoryId: number,
  ) {
    return this.categoriesService.findComponents(categoryId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createCategory(@Body() body: CreateCategoryDto) {
    return this.categoriesService.create(body);
  }
}
