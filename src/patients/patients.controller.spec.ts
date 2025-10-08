import { Test, TestingModule } from '@nestjs/testing';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { AppError } from '../common/errors/app-error.error';
import { ErrCode } from '../common/errors/error-codes.error';
import { PatientGender } from '../common/enums/patient-gender.enum';

describe('PatientsController', () => {
  let controller: PatientsController;
  let svc: jest.Mocked<PatientsService>;

  beforeEach(async () => {
    const svcMock: jest.Mocked<PatientsService> = {
      getAll: jest.fn(),
      getById: jest.fn(),
      getRequestsCount: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [{ provide: PatientsService, useValue: svcMock }],
    }).compile();

    controller = module.get(PatientsController);
    svc = module.get(PatientsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('list() → returns array', () => {
    svc.getAll.mockReturnValue([
      { id: '1', name: 'Alice', age: 30, gender: PatientGender.FEMALE } as any,
    ]);
    const out = controller.list();
    expect(out).toHaveLength(1);
    expect(svc.getAll).toHaveBeenCalled();
  });

  it('get(:id) → returns patient', () => {
    svc.getById.mockReturnValue({
      id: '1',
      name: 'Alice',
      age: 30,
      gender: PatientGender.FEMALE,
    } as any);
    const out = controller.get('1');
    expect(out.id).toBe('1');
    expect(svc.getById).toHaveBeenCalledWith('1');
  });

  it('get(:id) → propagates AppError not found', () => {
    svc.getById.mockImplementation(() => {
      throw AppError.notFound(ErrCode.PATIENT_NOT_FOUND, { id: '999' });
    });
    expect(() => controller.get('999')).toThrow(AppError);
  });

  it('requests(:id) → returns counter', () => {
    svc.getRequestsCount.mockReturnValue({ patientId: '1', requestsCount: 3 });
    const out = controller.requests('1');
    expect(out).toEqual({ patientId: '1', requestsCount: 3 });
    expect(svc.getRequestsCount).toHaveBeenCalledWith('1');
  });

  it('requests(:id) → propagates AppError not found', () => {
    svc.getRequestsCount.mockImplementation(() => {
      throw AppError.notFound(ErrCode.PATIENT_NOT_FOUND, { id: '404' });
    });
    expect(() => controller.requests('404')).toThrow(AppError);
  });
});
