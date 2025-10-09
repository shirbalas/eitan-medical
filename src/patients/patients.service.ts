import { Injectable } from '@nestjs/common';
import { PatientsRepository } from './repositories/patients.repository';
import { Patient } from './entities/patient.entity';
import { PinoLogger } from 'nestjs-pino';
import { AppError } from '../common/errors/app-error.error';
import { ErrCode } from '../common/errors/error-codes.error';

@Injectable()
export class PatientsService {
  constructor(
    private readonly patientsRepo: PatientsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PatientsService.name);
  }

  getAll(): Patient[] {
    try {
      const list = this.patientsRepo.findAll();
      this.logger.info({ count: list.length }, 'getAll patients');
      return list;
    } catch (e) {
      this.logger.error({ err: e }, 'getAll failed');
      throw AppError.internal();
    }
  }

  getById(id: string): Patient {
    try {
      const p = this.patientsRepo.findById(id);
      if (!p) {
        this.logger.warn({ patientId: id }, 'patient not found');
        throw AppError.notFound(ErrCode.PATIENT_NOT_FOUND, { id });
      }
      this.logger.info({ patientId: id }, 'getById patient');
      return p;
    } catch (e) {
      if (e instanceof AppError) throw e;
      this.logger.error({ err: e, patientId: id }, 'getById failed');
      throw AppError.internal({ patientId: id });
    }
  }

  getRequestsCount(id: string) {
    try {
      this.getById(id);
      const requestsCount = this.patientsRepo.getRequestCount(id);
      this.logger.info(
        { patientId: id, requestsCount },
        'requests counter read',
      );
      return { patientId: id, requestsCount };
    } catch (e) {
      if (e instanceof AppError) throw e;
      this.logger.error({ err: e, patientId: id }, 'getRequestsCount failed');
      throw AppError.internal({ patientId: id });
    }
  }
}
