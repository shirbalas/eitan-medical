import { Test, TestingModule } from '@nestjs/testing';
import { HeartRateController } from './heart-rate.controller';
import { HeartRateService } from './heart-rate.service';
import { AppError } from '../common/errors/app-error.error';
import { ErrCode } from '../common/errors/error-codes.error';

describe('HeartRateController', () => {
  let controller: HeartRateController;
  let svc: jest.Mocked<HeartRateService>;

  beforeEach(async () => {
    const svcMock: jest.Mocked<HeartRateService> = {
      getHighEvents: jest.fn(),
      getAnalytics: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HeartRateController],
      providers: [{ provide: HeartRateService, useValue: svcMock }],
    }).compile();

    controller = module.get(HeartRateController);
    svc = module.get(HeartRateService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('GET events (defaults) → calls service with default threshold only', () => {
    svc.getHighEvents.mockReturnValue({ patientId: '1', count: 0, events: [] });
    const out = controller.events('1', {} as any);
    expect(out).toEqual({ patientId: '1', count: 0, events: [] });
    expect(svc.getHighEvents).toHaveBeenCalledWith('1', undefined);
  });

  it('GET events (with threshold) → passes id, threshold', () => {
    svc.getHighEvents.mockReturnValue({
      patientId: '1',
      count: 1,
      events: [{ timestamp: '2024-03-01T10:30:00Z', heartRate: 101 }],
    });
    const out = controller.events('1', { threshold: 100 } as any);
    expect(out.count).toBe(1);
    expect(svc.getHighEvents).toHaveBeenCalledWith('1', 100);
  });

  it('GET analytics → passes id, from, to', () => {
    svc.getAnalytics.mockReturnValue({
      patientId: '1',
      from: 'a',
      to: 'b',
      count: 3,
      avg: 90,
      min: 80,
      max: 100,
    });

    const out = controller.analytics('1', { from: 'a', to: 'b' } as any);
    expect(out.count).toBe(3);
    expect(svc.getAnalytics).toHaveBeenCalledWith('1', 'a', 'b');
  });

  it('events propagates AppError from service', () => {
    svc.getHighEvents.mockImplementation(() => {
      throw AppError.badRequest(ErrCode.INVALID_THRESHOLD, { threshold: -1 });
    });
    expect(() => controller.events('1', { threshold: -1 } as any)).toThrow(
      AppError,
    );
  });

  it('analytics propagates AppError from service', () => {
    svc.getAnalytics.mockImplementation(() => {
      throw AppError.badRequest(ErrCode.INVALID_TIME_WINDOW, {
        from: 'b',
        to: 'a',
      });
    });
    expect(() =>
      controller.analytics('1', { from: 'b', to: 'a' } as any),
    ).toThrow(AppError);
  });
});
