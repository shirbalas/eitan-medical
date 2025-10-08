import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ProblemFilter } from '../src/common/filters/problem.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { randomUUID } from 'crypto';

function expectProblem(res: request.Response, status: number, code?: string) {
  expect(res.status).toBe(status);
  expect(res.body).toHaveProperty('type', 'about:blank');
  expect(res.body).toHaveProperty('title');
  expect(res.body).toHaveProperty('status', status);
  expect(res.body).toHaveProperty('instance');
  if (code) expect(res.body).toHaveProperty('code', code);
}

describe('Eitan Medical – E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = process.env.NODE_ENV || 'test';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new ProblemFilter());

    app.use((req: any, res, next) => {
      if (req?.id) res.setHeader('x-request-id', req.id);
      next();
    });

    app.use((req: any, res, next) => {
      if (!req.id) req.id = randomUUID();
      res.setHeader('x-request-id', req.id);
      next();
    });

    const config = new DocumentBuilder()
      .setTitle('Eitan Medical API')
      .setDescription('Patients & Heart Rate endpoints')
      .setVersion('1.0.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Meta', () => {
    it('GET /docs returns 200 (Swagger UI)', async () => {
      const res = await request(app.getHttpServer()).get('/docs');
      expect(res.status).toBe(200);
      expect(res.type).toMatch(/html/);
    });
  });

  describe('Patients', () => {
    it('GET /patients returns seeded list', async () => {
      const res = await request(app.getHttpServer()).get('/patients');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('GET /patients/1 returns a patient and sets x-request-id', async () => {
      const res = await request(app.getHttpServer()).get('/patients/1');
      expect(res.status).toBe(200);
      expect(res.headers['x-request-id']).toBeDefined();
      expect(res.body).toHaveProperty('id', '1');
    });

    it('GET /patients/999 -> 404 Problem Details (PATIENT_NOT_FOUND)', async () => {
      const res = await request(app.getHttpServer()).get('/patients/999');
      expectProblem(res, 404, 'PATIENT_NOT_FOUND');
    });
  });

  describe('Heart-rate', () => {
    it('GET /patients/1/heart-rate/events (default threshold=100) returns payload', async () => {
      const res = await request(app.getHttpServer()).get(
        '/patients/1/heart-rate/events',
      );
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('patientId', '1');
      expect(Array.isArray(res.body.events)).toBe(true);
    });

    it('GET /patients/1/heart-rate/events?threshold=-5 -> 400 VALIDATION_FAILED', async () => {
      const res = await request(app.getHttpServer())
        .get('/patients/1/heart-rate/events')
        .query({ threshold: -5 });
      expectProblem(res, 400, 'VALIDATION_FAILED');
      const arr = res.body.detail;
      expect(Array.isArray(arr)).toBe(true);
    });

    it('GET /patients/1/heart-rate/analytics valid window -> 200 with stats', async () => {
      const res = await request(app.getHttpServer())
        .get('/patients/1/heart-rate/analytics')
        .query({ from: '2024-03-01T00:00:00Z', to: '2024-03-01T23:59:59Z' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('patientId', '1');
      expect(res.body).toHaveProperty('count');
      expect(res.body).toHaveProperty('min');
      expect(res.body).toHaveProperty('max');
      expect(res.body).toHaveProperty('avg');
    });

    it('GET /patients/1/heart-rate/analytics invalid window (from>to) -> 400 INVALID_TIME_WINDOW', async () => {
      const res = await request(app.getHttpServer())
        .get('/patients/1/heart-rate/analytics')
        .query({ from: '2024-03-02T00:00:00Z', to: '2024-03-01T00:00:00Z' });
      expectProblem(res, 400, 'INVALID_TIME_WINDOW');
    });

    it('GET /patients/999/heart-rate/events -> 404 PATIENT_NOT_FOUND', async () => {
      const res = await request(app.getHttpServer()).get(
        '/patients/999/heart-rate/events',
      );
      expectProblem(res, 404, 'PATIENT_NOT_FOUND');
    });
  });

  describe('Requests counter', () => {
    it('counts only patient-data endpoints (profile + heart-rate), not /requests itself', async () => {
      await request(app.getHttpServer()).get('/patients/1');
      await request(app.getHttpServer()).get('/patients/1/heart-rate/events');

      const res1 = await request(app.getHttpServer()).get(
        '/patients/1/requests',
      );
      expect(res1.status).toBe(200);
      const before = res1.body.requestsCount;

      await request(app.getHttpServer()).get('/patients/1/requests');
      const res2 = await request(app.getHttpServer()).get(
        '/patients/1/requests',
      );
      expect(res2.body.requestsCount).toBe(before);

      await request(app.getHttpServer())
        .get('/patients/1/heart-rate/analytics')
        .query({ from: '2024-03-01T00:00:00Z', to: '2024-03-01T23:59:59Z' });
      const res3 = await request(app.getHttpServer()).get(
        '/patients/1/requests',
      );
      expect(res3.body.requestsCount).toBeGreaterThan(before);
    });
  });
});
