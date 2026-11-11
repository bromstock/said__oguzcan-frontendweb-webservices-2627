import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('sup g!');
  });

  it('supports the build, component, category, and user API flow', async () => {
    const userResponse = await request(app.getHttpServer())
      .post('/api/users')
      .send({
        username: 'builder',
        email: 'builder@example.test',
        password_hash: 'test-hash',
      })
      .expect(201);
    expect(userResponse.body).toMatchObject({
      user_id: 1,
      username: 'builder',
      email: 'builder@example.test',
    });
    expect(userResponse.body.password_hash).toBeUndefined();

    const categoryResponse = await request(app.getHttpServer())
      .post('/api/categories')
      .send({ name: 'Processor', description: 'CPUs' })
      .expect(201);
    const categoryId = categoryResponse.body.category_id as number;

    const componentResponse = await request(app.getHttpServer())
      .post('/api/components')
      .send({ name: 'Example CPU', category_id: categoryId, price: 250 })
      .expect(201);
    const componentId = componentResponse.body.component_id as number;

    const secondComponentResponse = await request(app.getHttpServer())
      .post('/api/components')
      .send({ name: 'Second CPU', category_id: categoryId })
      .expect(201);
    const secondComponentId = secondComponentResponse.body
      .component_id as number;

    const buildResponse = await request(app.getHttpServer())
      .post('/api/builds')
      .send({
        name: 'Workstation',
        user_id: userResponse.body.user_id,
        components: [{ component_id: componentId, quantity: 1 }],
      })
      .expect(201);
    const buildId = buildResponse.body.build_id as number;
    expect(buildResponse.body.user).not.toHaveProperty('password_hash');
    expect(buildResponse.body.components).toHaveLength(1);

    const relatedBuildResponse = await request(app.getHttpServer())
      .post('/api/builds')
      .send({
        name: 'Another workstation',
        user_id: userResponse.body.user_id,
        components: [{ component_id: secondComponentId, quantity: 2 }],
      })
      .expect(201);
    const relatedBuildId = relatedBuildResponse.body.build_id as number;

    await request(app.getHttpServer())
      .get('/api/builds')
      .expect(200)
      .expect(({ body }) => expect(body).toHaveLength(2));
    await request(app.getHttpServer())
      .get(`/api/builds/${buildId}`)
      .expect(200)
      .expect(({ body }) => expect(body.name).toBe('Workstation'));
    await request(app.getHttpServer())
      .get(`/api/builds/${buildId}/components`)
      .expect(200)
      .expect(({ body }) => expect(body[0].quantity).toBe(1));
    await request(app.getHttpServer())
      .get(`/api/builds/${buildId}/categories`)
      .expect(200)
      .expect(({ body }) =>
        expect(
          body.map((build: { build_id: number }) => build.build_id),
        ).toContain(relatedBuildId),
      );
    await request(app.getHttpServer())
      .get('/api/components')
      .expect(200)
      .expect(({ body }) => expect(body).toHaveLength(2));
    await request(app.getHttpServer())
      .get(`/api/components/${componentId}`)
      .expect(200)
      .expect(({ body }) => expect(body.name).toBe('Example CPU'));
    await request(app.getHttpServer())
      .get('/api/categories')
      .expect(200)
      .expect(({ body }) => expect(body).toHaveLength(1));
    await request(app.getHttpServer())
      .get(`/api/categories/${categoryId}/components`)
      .expect(200)
      .expect(({ body }) => expect(body).toHaveLength(2));

    await request(app.getHttpServer())
      .post(`/api/builds/${buildId}/components/${secondComponentId}`)
      .send({ quantity: 3 })
      .expect(201);
    await request(app.getHttpServer())
      .put(`/api/builds/${buildId}/components/${secondComponentId}`)
      .send({ quantity: 4 })
      .expect(200)
      .expect(({ body }) => expect(body.quantity).toBe(4));
    await request(app.getHttpServer())
      .put(`/api/builds/${buildId}`)
      .send({ name: 'Updated workstation' })
      .expect(200)
      .expect(({ body }) => expect(body.name).toBe('Updated workstation'));
    await request(app.getHttpServer())
      .delete(`/api/builds/${buildId}/components/${secondComponentId}`)
      .expect(204);
    await request(app.getHttpServer())
      .delete(`/api/builds/${buildId}/components/${componentId}`)
      .expect(400);
    await request(app.getHttpServer())
      .delete(`/api/builds/${relatedBuildId}`)
      .expect(204);
  });

  afterEach(async () => {
    await app.close();
  });
});
