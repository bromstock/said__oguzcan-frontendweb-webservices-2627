import { Injectable } from '@nestjs/common';

export interface UserRecord {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
}

export interface CategoryRecord {
  category_id: number;
  name: string;
  description?: string;
}

export interface ComponentRecord {
  component_id: number;
  name?: string;
  manufacturer?: string;
  form_factor?: string;
  tdp_watts?: number;
  storage?: number;
  ram?: number;
  speed?: number;
  case_volume?: number;
  noise_level_db?: number;
  description?: string;
  detail?: string;
  price?: number;
  category_id?: number;
}

export interface BuildRecord {
  build_id: number;
  name: string;
  description?: string;
  user_id: number;
}

export interface BuildComponentRecord {
  build_id: number;
  component_id: number;
  quantity: number;
}

@Injectable()
export class InMemoryStore {
  readonly users: UserRecord[] = [];
  readonly categories: CategoryRecord[] = [];
  readonly components: ComponentRecord[] = [];
  readonly builds: BuildRecord[] = [];
  readonly buildComponents: BuildComponentRecord[] = [];

  private nextUserId = 1;
  private nextCategoryId = 1;
  private nextComponentId = 1;
  private nextBuildId = 1;

  createUser(user: Omit<UserRecord, 'user_id'>): UserRecord {
    const record = { user_id: this.nextUserId++, ...user };
    this.users.push(record);
    return record;
  }

  createCategory(
    category: Omit<CategoryRecord, 'category_id'>,
  ): CategoryRecord {
    const record = { category_id: this.nextCategoryId++, ...category };
    this.categories.push(record);
    return record;
  }

  createComponent(
    component: Omit<ComponentRecord, 'component_id'>,
  ): ComponentRecord {
    const record = { component_id: this.nextComponentId++, ...component };
    this.components.push(record);
    return record;
  }

  createBuild(build: Omit<BuildRecord, 'build_id'>): BuildRecord {
    const record = { build_id: this.nextBuildId++, ...build };
    this.builds.push(record);
    return record;
  }
}
