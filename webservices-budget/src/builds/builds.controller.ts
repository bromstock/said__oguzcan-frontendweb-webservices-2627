import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { CreateBuildDto } from './create-build.dto';
import { UpdateBuildComponentDto } from '../build-components/update-build-component.dto';
import { BuildsService } from './builds.service';
import { UpdateBuildDto } from './update-build.dto';

@Controller('builds')
export class BuildsController {
  constructor(private readonly buildsService: BuildsService) {}

  @Get()
  getBuilds() {
    return this.buildsService.findAll();
  }

  @Get(':buildId')
  getBuild(@Param('buildId', ParseIntPipe) buildId: number) {
    return this.buildsService.findOne(buildId);
  }

  @Get(':buildId/components')
  getComponents(@Param('buildId', ParseIntPipe) buildId: number) {
    return this.buildsService.findComponents(buildId);
  }

  @Get(':buildId/categories')
  getBuildsWithSameCategories(@Param('buildId', ParseIntPipe) buildId: number) {
    return this.buildsService.findRelatedBuilds(buildId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createBuild(@Body() body: CreateBuildDto) {
    return this.buildsService.create(body);
  }

  @Put(':buildId')
  updateBuild(
    @Param('buildId', ParseIntPipe) buildId: number,
    @Body() body: UpdateBuildDto,
  ) {
    return this.buildsService.update(buildId, body);
  }

  @Delete(':buildId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteBuild(@Param('buildId', ParseIntPipe) buildId: number) {
    return this.buildsService.remove(buildId);
  }

  @Post(':buildId/components/:componentId')
  @HttpCode(HttpStatus.CREATED)
  addBuildComponent(
    @Param('buildId', ParseIntPipe) buildId: number,
    @Param('componentId', ParseIntPipe) componentId: number,
    @Body() body: UpdateBuildComponentDto | undefined,
  ) {
    return this.buildsService.addComponent(
      buildId,
      componentId,
      body?.quantity,
    );
  }

  @Put(':buildId/components/:componentId')
  updateBuildComponent(
    @Param('buildId', ParseIntPipe) buildId: number,
    @Param('componentId', ParseIntPipe) componentId: number,
    @Body() body: UpdateBuildComponentDto | undefined,
  ) {
    return this.buildsService.updateComponent(buildId, componentId, body);
  }

  @Delete(':buildId/components/:componentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteBuildComponent(
    @Param('buildId', ParseIntPipe) buildId: number,
    @Param('componentId', ParseIntPipe) componentId: number,
  ) {
    return this.buildsService.removeComponent(buildId, componentId);
  }
}
