import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray, ne } from 'drizzle-orm';
import { UpdateBuildComponentDto } from '../build-components/update-build-component.dto';
import { DatabaseService } from '../database/database.service';
import {
  buildComponents,
  builds,
  categories,
  components,
  users,
} from '../database/schema';
import { CreateBuildDto } from './create-build.dto';
import { UpdateBuildDto } from './update-build.dto';

@Injectable()
export class BuildsService {
  constructor(private readonly database: DatabaseService) {}

  findAll() {
    return this.loadBuilds();
  }

  async findOne(buildId: number) {
    const [build] = await this.loadBuilds(undefined, buildId);
    if (!build) {
      throw new NotFoundException('Build not found');
    }
    return build;
  }

  async create(dto: CreateBuildDto) {
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

    const [user] = await this.database.db
      .select({ user_id: users.user_id })
      .from(users)
      .where(eq(users.user_id, dto.user_id));
    if (!user) {
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
      await this.requireComponent(component.component_id);
      this.validateQuantity(component.quantity);
      if (componentIds.has(component.component_id)) {
        throw new BadRequestException(
          'A component can only be included once in a build',
        );
      }
      componentIds.add(component.component_id);
    }

    const buildId = await this.database.db.transaction(async (transaction) => {
      const [inserted] = await transaction
        .insert(builds)
        .values({
          name: dto.name,
          description: dto.description,
          user_id: dto.user_id,
        })
        .$returningId();
      await transaction.insert(buildComponents).values(
        dto.components.map((component) => ({
          build_id: inserted.build_id,
          component_id: component.component_id,
          quantity: component.quantity,
        })),
      );
      return inserted.build_id;
    });

    return this.findOne(buildId);
  }

  async update(buildId: number, dto: UpdateBuildDto) {
    await this.findOne(buildId);
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

    if (Object.keys(dto).length > 0) {
      await this.database.db
        .update(builds)
        .set(dto)
        .where(eq(builds.build_id, buildId));
    }
    return this.findOne(buildId);
  }

  async remove(buildId: number) {
    await this.findOne(buildId);
    await this.database.db.delete(builds).where(eq(builds.build_id, buildId));
  }

  async findComponents(buildId: number) {
    await this.findOne(buildId);
    const rows = await this.database.db
      .select({ component: components, quantity: buildComponents.quantity })
      .from(buildComponents)
      .innerJoin(
        components,
        eq(buildComponents.component_id, components.component_id),
      )
      .where(eq(buildComponents.build_id, buildId));
    return rows.map(({ component, quantity }) => ({
      ...component,
      quantity,
    }));
  }

  async addComponent(buildId: number, componentId: number, quantity: unknown) {
    await this.findOne(buildId);
    await this.requireComponent(componentId);
    this.validateQuantity(quantity);

    const [existing] = await this.database.db
      .select({ component_id: buildComponents.component_id })
      .from(buildComponents)
      .where(
        and(
          eq(buildComponents.build_id, buildId),
          eq(buildComponents.component_id, componentId),
        ),
      );
    if (existing) {
      throw new BadRequestException('The component is already in this build');
    }

    await this.database.db.insert(buildComponents).values({
      build_id: buildId,
      component_id: componentId,
      quantity,
    });
    return this.findComponents(buildId);
  }

  async updateComponent(
    buildId: number,
    componentId: number,
    dto: UpdateBuildComponentDto | undefined,
  ) {
    await this.findOne(buildId);
    await this.requireComponent(componentId);
    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('A request body is required');
    }
    this.validateQuantity(dto.quantity);

    const [entry] = await this.database.db
      .select({ component_id: buildComponents.component_id })
      .from(buildComponents)
      .where(
        and(
          eq(buildComponents.build_id, buildId),
          eq(buildComponents.component_id, componentId),
        ),
      );
    if (!entry) {
      throw new NotFoundException('Component not found in this build');
    }

    await this.database.db
      .update(buildComponents)
      .set({ quantity: dto.quantity })
      .where(
        and(
          eq(buildComponents.build_id, buildId),
          eq(buildComponents.component_id, componentId),
        ),
      );
    const [updated] = await this.database.db
      .select({ component: components, quantity: buildComponents.quantity })
      .from(buildComponents)
      .innerJoin(
        components,
        eq(buildComponents.component_id, components.component_id),
      )
      .where(
        and(
          eq(buildComponents.build_id, buildId),
          eq(buildComponents.component_id, componentId),
        ),
      );
    return {
      ...updated.component,
      quantity: updated.quantity,
    };
  }

  async removeComponent(buildId: number, componentId: number) {
    await this.findOne(buildId);
    const entries = await this.database.db
      .select({ component_id: buildComponents.component_id })
      .from(buildComponents)
      .where(eq(buildComponents.build_id, buildId));
    if (!entries.some((entry) => entry.component_id === componentId)) {
      throw new NotFoundException('Component not found in this build');
    }
    if (entries.length === 1) {
      throw new BadRequestException('A build must have at least one component');
    }

    await this.database.db
      .delete(buildComponents)
      .where(
        and(
          eq(buildComponents.build_id, buildId),
          eq(buildComponents.component_id, componentId),
        ),
      );
  }

  async findRelatedBuilds(buildId: number) {
    await this.findOne(buildId);
    const buildItems = await this.findComponents(buildId);
    const categoryIds = [
      ...new Set(
        buildItems
          .map((component) => component.category_id)
          .filter((categoryId): categoryId is number => categoryId !== null),
      ),
    ];
    if (categoryIds.length === 0) {
      return [];
    }

    const related = await this.database.db
      .selectDistinct({ build_id: builds.build_id })
      .from(builds)
      .innerJoin(buildComponents, eq(builds.build_id, buildComponents.build_id))
      .innerJoin(
        components,
        eq(buildComponents.component_id, components.component_id),
      )
      .innerJoin(categories, eq(components.category_id, categories.category_id))
      .where(
        and(
          ne(builds.build_id, buildId),
          inArray(components.category_id, categoryIds),
        ),
      );

    return this.loadBuilds(related.map(({ build_id }) => build_id));
  }

  private async requireComponent(componentId: number) {
    const [component] = await this.database.db
      .select({ component_id: components.component_id })
      .from(components)
      .where(eq(components.component_id, componentId));
    if (!component) {
      throw new NotFoundException('Component not found');
    }
    return component;
  }

  private validateQuantity(quantity: unknown): asserts quantity is number {
    if (
      typeof quantity !== 'number' ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      throw new BadRequestException('Quantity must be a positive integer');
    }
  }

  private async loadBuilds(buildIds?: number[], exactBuildId?: number) {
    if (buildIds?.length === 0) {
      return [];
    }
    const filters = [];
    if (buildIds) {
      filters.push(inArray(builds.build_id, buildIds));
    }
    if (exactBuildId !== undefined) {
      filters.push(eq(builds.build_id, exactBuildId));
    }

    const buildRows = await this.database.db
      .select({
        build: builds,
        user: {
          user_id: users.user_id,
          username: users.username,
          email: users.email,
        },
      })
      .from(builds)
      .innerJoin(users, eq(builds.user_id, users.user_id))
      .innerJoin(buildComponents, eq(builds.build_id, buildComponents.build_id))
      .where(filters.length > 0 ? and(...filters) : undefined);

    const uniqueBuilds = new Map<number, (typeof buildRows)[number]>();
    for (const row of buildRows) {
      uniqueBuilds.set(row.build.build_id, row);
    }
    if (uniqueBuilds.size === 0) {
      return [];
    }

    const ids = [...uniqueBuilds.keys()];
    const entries = await this.database.db
      .select({
        build_id: buildComponents.build_id,
        component: components,
        quantity: buildComponents.quantity,
      })
      .from(buildComponents)
      .innerJoin(
        components,
        eq(buildComponents.component_id, components.component_id),
      )
      .where(inArray(buildComponents.build_id, ids));
    const entriesByBuild = new Map<
      number,
      Array<(typeof entries)[number]['component'] & { quantity: number }>
    >();
    for (const entry of entries) {
      const componentsForBuild = entriesByBuild.get(entry.build_id) ?? [];
      componentsForBuild.push({
        ...entry.component,
        quantity: entry.quantity,
      });
      entriesByBuild.set(entry.build_id, componentsForBuild);
    }

    return [...uniqueBuilds.values()].map(({ build, user }) => ({
      ...build,
      user,
      components: entriesByBuild.get(build.build_id) ?? [],
    }));
  }
}
