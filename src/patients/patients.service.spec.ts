import { PatientsService } from './patients.service';
import { PatientsRepository } from './repositories/patients.repository';
import { AppError } from '../common/errors/app-error.error';
import { ErrCode } from '../common/errors/error-codes.error';
import { createLoggerMock } from '../../test/logger.mock';
import { PatientGender } from '../common/enums/patient-gender.enum';

describe('PatientsService (unit)', () => {
  let repo: PatientsRepository;
  let svc: PatientsService;
  let logger: ReturnType<typeof createLoggerMock>;

  beforeEach(() => {
    repo = new PatientsRepository();
    repo.upsertMany([
      { id: '1', name: 'Alice', age: 30, gender: PatientGender.FEMALE } as any,
      { id: '2', name: 'Bob', age: 40, gender: PatientGender.MALE } as any,
    ]);
    logger = createLoggerMock();
    svc = new PatientsService(repo, logger as any);
  });

  it('getAll returns all patients', () => {
    const all = svc.getAll();
    expect(all).toHaveLength(2);
    expect(all.map((p) => p.id)).toEqual(expect.arrayContaining(['1', '2']));
  });

  it('getById returns patient when exists', () => {
    const p = svc.getById('1');
    expect(p.name).toBe('Alice');
  });

  it('getById throws AppError (not found) when patient missing', () => {
    expect(() => svc.getById('999')).toThrow(AppError);
    try {
      svc.getById('999');
    } catch (e) {
      const err = e as AppError;
      expect(err.code).toBe(ErrCode.PATIENT_NOT_FOUND);
      expect(err.status).toBe(404);
    }
  });

  it('getRequestsCount returns 0 initially', () => {
    const out = svc.getRequestsCount('1');
    expect(out).toEqual({ patientId: '1', requestsCount: 0 });
  });

  it('getRequestsCount increases when repository increments (simulating middleware)', () => {
    repo.incRequestCount('1');
    repo.incRequestCount('1');
    const out = svc.getRequestsCount('1');
    expect(out).toEqual({ patientId: '1', requestsCount: 2 });
  });

  it('getRequestsCount throws not found for unknown patient', () => {
    expect(() => svc.getRequestsCount('999')).toThrow(AppError);
    try {
      svc.getRequestsCount('999');
    } catch (e) {
      const err = e as AppError;
      expect(err.code).toBe(ErrCode.PATIENT_NOT_FOUND);
      expect(err.status).toBe(404);
    }
  });
});
