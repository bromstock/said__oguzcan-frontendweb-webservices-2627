import {
  decimal,
  double,
  foreignKey,
  int,
  mysqlTable,
  primaryKey,
  text,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

export const users = mysqlTable(
  'users',
  {
    user_id: int().autoincrement().primaryKey(),
    username: varchar({ length: 100 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    password_hash: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex('users_username_unique').on(table.username),
    uniqueIndex('users_email_unique').on(table.email),
  ],
);

export const categories = mysqlTable('categories', {
  category_id: int().autoincrement().primaryKey(),
  name: varchar({ length: 100 }).notNull(),
  description: text(),
});

export const components = mysqlTable(
  'components',
  {
    component_id: int().autoincrement().primaryKey(),
    name: varchar({ length: 150 }),
    manufacturer: varchar({ length: 150 }),
    form_factor: varchar({ length: 100 }),
    tdp_watts: double(),
    storage: double(),
    ram: double(),
    speed: double(),
    case_volume: double(),
    noise_level_db: double(),
    description: text(),
    detail: text(),
    price: decimal({ precision: 10, scale: 2, mode: 'number' }),
    category_id: int(),
  },
  (table) => [
    foreignKey({
      columns: [table.category_id],
      foreignColumns: [categories.category_id],
      name: 'components_category_id_categories_category_id_fk',
    }).onDelete('set null'),
  ],
);

export const builds = mysqlTable(
  'builds',
  {
    build_id: int().autoincrement().primaryKey(),
    name: varchar({ length: 150 }).notNull(),
    description: text(),
    user_id: int().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.user_id],
      foreignColumns: [users.user_id],
      name: 'builds_user_id_users_user_id_fk',
    }).onDelete('cascade'),
  ],
);

export const buildComponents = mysqlTable(
  'build_components',
  {
    build_id: int().notNull(),
    component_id: int().notNull(),
    quantity: int().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.build_id, table.component_id],
    }),
    foreignKey({
      columns: [table.build_id],
      foreignColumns: [builds.build_id],
      name: 'build_components_build_id_builds_build_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.component_id],
      foreignColumns: [components.component_id],
      name: 'build_components_component_id_components_component_id_fk',
    }).onDelete('cascade'),
  ],
);
