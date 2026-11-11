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
import { CreateComponentDto } from './create-component.dto';
import { ComponentsService } from './components.service';

@Controller('components')
export class ComponentsController {
  constructor(private readonly componentsService: ComponentsService) {}

  @Get()
  getComponents() {
    return this.componentsService.findAll();
  }

  @Get(':componentId')
  getComponent(@Param('componentId', ParseIntPipe) componentId: number) {
    return this.componentsService.findOne(componentId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createComponent(@Body() body: CreateComponentDto) {
    return this.componentsService.create(body);
  }
}
