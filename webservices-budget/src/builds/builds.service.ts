import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InMemoryStore } from '../in-memory-store';
import { CreateBuildDto } from './create-build.dto';
import { UpdateBuildDto } from './update-build.dto';
import { UpdateBuildComponentDto } from '../build-components/update-build-component.dto';

@Injectable()
export class BuildsService {
  constructor(private readonly store: InMemoryStore) {}

  findAll() {
    return this.store.builds
      .filter((build) =>
        this.store.buildComponents.some(
          (entry) => entry.build_id === build.build_id,
        ),
      )
      .map((build) => this.withRelations(build));
  }

  findOne(buildId: number) {
    return this.withRelations(this.getBuild(buildId));
  }

  create(dto: CreateBuildDto) {
    if (!dto || typeof dto.name !== 'string' || dto.name.trim().length === 0) {
      throw new BadRequestException('Build name is required');
    }
    if (dto.description !== undefined && typeof dto.description !== 'string') {
      throw new BadRequestException('Build description must be a string');
    }

    if (!Array.isArray(dto.components) || dto.components.length === 0) {
      throw new BadRequestException('A build must have at least one component');
    }

    if (!Number.isInteger(dto.user_id) || dto.user_id < 1) {
      throw new BadRequestException('A valid user_id is required');
    }
    if (!this.store.users.some((user) => user.user_id === dto.user_id)) {
      throw new BadRequestException('The specified user does not exist');
    }

    const componentIds = new Set<number>();
    for (const component of dto.components) {
      if (!component || typeof component !== 'object') {
        throw new BadRequestException('Each component entry must be an object');
      }
      if (
        !Number.isInteger(component.component_id) ||
        component.component_id < 1
      ) {
        throw new BadRequestException(
          'Each component entry must have a valid component_id',
        );
      }
      this.requireComponent(component.component_id);
      this.validateQuantity(component.quantity);
      if (componentIds.has(component.component_id)) {
        throw new BadRequestException(
          'A component can only be included once in a build',
        );
      }
      componentIds.add(component.component_id);
    }

    const build = this.store.createBuild({
      name: dto.name,
      description: dto.description,
      user_id: dto.user_id,
    });

    this.store.buildComponents.push(
      ...dto.components.map((component) => ({
        build_id: build.build_id,
        component_id: component.component_id,
        quantity: component.quantity,
      })),
    );

    return this.withRelations(build);
  }

  update(buildId: number, dto: UpdateBuildDto) {
    const build = this.getBuild(buildId);
    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('A request body is required');
    }
    if (
      dto.name !== undefined &&
      (typeof dto.name !== 'string' || dto.name.trim().length === 0)
    ) {
      throw new BadRequestException('Build name cannot be empty');
    }
    if (dto.description !== undefined && typeof dto.description !== 'string') {
      throw new BadRequestException('Build description must be a string');
    }
    Object.assign(build, dto);
    return this.withRelations(build);
  }

  remove(buildId: number) {
    this.getBuild(buildId);
    const buildIndex = this.store.builds.findIndex(
      (build) => build.build_id === buildId,
    );
    this.store.builds.splice(buildIndex, 1);

    for (
      let index = this.store.buildComponents.length - 1;
      index >= 0;
      index--
    ) {
      if (this.store.buildComponents[index].build_id === buildId) {
        this.store.buildComponents.splice(index, 1);
      }
    }
  }

  findComponents(buildId: number) {
    this.getBuild(buildId);
    return this.store.buildComponents
      .filter((entry) => entry.build_id === buildId)
      .map((entry) => ({
        ...this.requireComponent(entry.component_id),
        quantity: entry.quantity,
      }));
  }

  addComponent(buildId: number, componentId: number, quantity: unknown) {
    this.getBuild(buildId);
    this.requireComponent(componentId);
    this.validateQuantity(quantity);

    if (
      this.store.buildComponents.some(
        (entry) =>
          entry.build_id === buildId && entry.component_id === componentId,
      )
    ) {
      throw new BadRequestException('The component is already in this build');
    }

    this.store.buildComponents.push({
      build_id: buildId,
      component_id: componentId,
      quantity,
    });
    return this.findComponents(buildId);
  }

  updateComponent(
    buildId: number,
    componentId: number,
    dto: UpdateBuildComponentDto | undefined,
  ) {
    this.getBuild(buildId);
    this.requireComponent(componentId);
    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('A request body is required');
    }
    this.validateQuantity(dto.quantity);

    const entry = this.store.buildComponents.find(
      (item) => item.build_id === buildId && item.component_id === componentId,
    );
    if (!entry) {
      throw new NotFoundException('Component not found in this build');
    }

    entry.quantity = dto.quantity;
    return {
      ...this.requireComponent(componentId),
      quantity: entry.quantity,
    };
  }

  removeComponent(buildId: number, componentId: number) {
    this.getBuild(buildId);
    const entryIndex = this.store.buildComponents.findIndex(
      (entry) =>
        entry.build_id === buildId && entry.component_id === componentId,
    );
    if (entryIndex === -1) {
      throw new NotFoundException('Component not found in this build');
    }
    if (
      this.store.buildComponents.filter((entry) => entry.build_id === buildId)
        .length === 1
    ) {
      throw new BadRequestException('A build must have at least one component');
    }

    this.store.buildComponents.splice(entryIndex, 1);
  }

  findRelatedBuilds(buildId: number) {
    const build = this.getBuild(buildId);
    const categoryIds = new Set(
      this.findComponents(buildId)
        .map((component) => component.category_id)
        .filter((categoryId): categoryId is number => categoryId !== undefined),
    );

    return this.store.builds
      .filter(
        (candidate) =>
          candidate.build_id !== build.build_id &&
          this.store.buildComponents.some((entry) => {
            if (entry.build_id !== candidate.build_id) {
              return false;
            }
            const component = this.requireComponent(entry.component_id);
            return (
              component.category_id !== undefined &&
              categoryIds.has(component.category_id)
            );
          }),
      )
      .map((candidate) => this.withRelations(candidate));
  }

  // Finds a build by ID and throws a 404 error when it does not exist.
  private getBuild(buildId: number) {
    const build = this.store.builds.find((item) => item.build_id === buildId);
    if (!build) {
      throw new NotFoundException('Build not found');
    }
    return build;
  }

  // Finds a component by ID and throws a 404 error when it does not exist.
  private requireComponent(componentId: number) {
    const component = this.store.components.find(
      (item) => item.component_id === componentId,
    );
    if (!component) {
      throw new NotFoundException('Component not found');
    }
    return component;
  }

  // Checks that a quantity is a positive integer; the assertion also narrows
  // the TypeScript type to number after this method succeeds.
  private validateQuantity(quantity: unknown): asserts quantity is number {
    if (
      typeof quantity !== 'number' ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      throw new BadRequestException('Quantity must be a positive integer');
    }
  }

  // Returns a copy of the build enriched with its public user details and
  // components, without exposing the stored password hash.
  private withRelations(build: (typeof this.store.builds)[number]) {
    const user = this.store.users.find(
      (item) => item.user_id === build.user_id,
    );

    return {
      ...build,
      user: user
        ? {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
          }
        : null,
      components: this.store.buildComponents
        .filter((entry) => entry.build_id === build.build_id)
        .map((entry) => ({
          ...this.requireComponent(entry.component_id),
          quantity: entry.quantity,
        })),
    };
  }
}
