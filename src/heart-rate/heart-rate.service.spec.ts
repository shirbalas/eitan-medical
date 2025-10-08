import { HeartRateService } from './heart-rate.service';
import { HeartRateRepository } from './repositories/heart-rate.repository';
import { PatientsRepository } from '../patients/repositories/patients.repository';
import { AppError } from '../common/errors/app-error.error';
import { ErrCode } from '../common/errors/error-codes.error';
import { createLoggerMock } from '../../test/logger.mock';
import { PatientGender } from '../common/enums/patient-gender.enum';

function seed(hrRepo: HeartRateRepository, pRepo: PatientsRepository) {
  pRepo.upsertMany([
    { id: '1', name: 'Alice', age: 30, gender: PatientGender.FEMALE } as any,
  ]);
  hrRepo.upsertMany([
    { patientId: '1', timestamp: '2024-03-01T10:00:00Z', heartRate: 85 },
    { patientId: '1', timestamp: '2024-03-01T10:30:00Z', heartRate: 101 },
    { patientId: '1', timestamp: '2024-03-01T11:00:00Z', heartRate: 97 },
    { patientId: '1', timestamp: 'not-a-date', heartRate: 200 } as any,
  ]);
}

describe('HeartRateService (unit)', () => {
  let hrRepo: HeartRateRepository;
  let pRepo: PatientsRepository;
  let svc: HeartRateService;
  let logger: ReturnType<typeof createLoggerMock>;

  beforeEach(() => {
    hrRepo = new HeartRateRepository();
    pRepo = new PatientsRepository();
    seed(hrRepo, pRepo);
    logger = createLoggerMock();
    svc = new HeartRateService(hrRepo, pRepo, logger as any);
  });

  describe('getHighEvents', () => {
    it('uses default threshold=100 when not provided', () => {
      const out = svc.getHighEvents('1', undefined);
      expect(out.count).toBe(1);
      expect(out.events[0]).toMatchObject({ heartRate: 101 });
    });

    it('applies explicit threshold (strictly greater than)', () => {
      expect(svc.getHighEvents('1', 101).count).toBe(0);
      expect(svc.getHighEvents('1', 100).count).toBe(1);
    });

    it('returns empty when no events above threshold', () => {
      const out = svc.getHighEvents('1', 1000);
      expect(out.count).toBe(0);
      expect(out.events).toEqual([]);
    });

    it('throws INVALID_THRESHOLD for negative threshold', () => {
      expect(() => svc.getHighEvents('1', -1)).toThrow(AppError);
      try {
        svc.getHighEvents('1', -1);
      } catch (e) {
        const err = e as AppError;
        expect(err.code).toBe(ErrCode.INVALID_THRESHOLD);
        expect(err.status).toBe(400);
      }
    });

    it('throws PATIENT_NOT_FOUND when patient missing', () => {
      expect(() => svc.getHighEvents('999', 100)).toThrow(AppError);
      try {
        svc.getHighEvents('999', 100);
      } catch (e) {
        const err = e as AppError;
        expect(err.code).toBe(ErrCode.PATIENT_NOT_FOUND);
        expect(err.status).toBe(404);
      }
    });
  });

  describe('getAnalytics', () => {
    it('computes min/max/avg and count within window', () => {
      const out = svc.getAnalytics(
        '1',
        '2024-03-01T00:00:00Z',
        '2024-03-01T23:59:59Z',
      );
      expect(out.count).toBe(3);
      expect(out.min).toBe(85);
      expect(out.max).toBe(101);
      expect(out.avg).toBeCloseTo(94.33, 2);
    });

    it('returns count=0 and nulls when no data in window', () => {
      const out = svc.getAnalytics(
        '1',
        '2024-03-02T00:00:00Z',
        '2024-03-02T23:59:59Z',
      );
      expect(out).toMatchObject({
        patientId: '1',
        count: 0,
        avg: null,
        min: null,
        max: null,
      });
    });

    it('throws INVALID_TIME_WINDOW if from>to', () => {
      expect(() =>
        svc.getAnalytics('1', '2024-03-02T00:00:00Z', '2024-03-01T00:00:00Z'),
      ).toThrow(AppError);
      try {
        svc.getAnalytics('1', '2024-03-02T00:00:00Z', '2024-03-01T00:00:00Z');
      } catch (e) {
        const err = e as AppError;
        expect(err.code).toBe(ErrCode.INVALID_TIME_WINDOW);
        expect(err.status).toBe(400);
      }
    });

    it('throws PATIENT_NOT_FOUND when patient missing', () => {
      expect(() =>
        svc.getAnalytics('999', '2024-03-01T00:00:00Z', '2024-03-01T23:59:59Z'),
      ).toThrow(AppError);
      try {
        svc.getAnalytics('999', '2024-03-01T00:00:00Z', '2024-03-01T23:59:59Z');
      } catch (e) {
        const err = e as AppError;
        expect(err.code).toBe(ErrCode.PATIENT_NOT_FOUND);
        expect(err.status).toBe(404);
      }
    });

    it('respects boundary times (inclusive range behavior via inRange)', () => {
      const outStart = svc.getAnalytics(
        '1',
        '2024-03-01T10:00:00Z',
        '2024-03-01T10:00:00Z',
      );
      expect(outStart.count).toBe(1);
      expect(outStart.min).toBe(85);
      expect(outStart.max).toBe(85);
      expect(outStart.avg).toBe(85);
    });
  });
});
