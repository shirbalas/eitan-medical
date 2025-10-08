import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { HeartRateRepository } from './repositories/heart-rate.repository';
import { PatientsRepository } from '../patients/repositories/patients.repository';
import { assertValidWindow, inRange } from './utils/time-range.utils';
import { AppError } from '../common/errors/app-error.error';
import { ErrCode } from '../common/errors/error-codes.error';

@Injectable()
export class HeartRateService {
  constructor(
    private readonly hrRepo: HeartRateRepository,
    private readonly patientsRepo: PatientsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(HeartRateService.name);
  }

  private ensurePatient(id: string) {
    if (!this.patientsRepo.findById(id)) {
      this.logger.warn({ patientId: id }, 'patient not found');
      throw AppError.notFound(ErrCode.PATIENT_NOT_FOUND, { id });
    }
  }

  getHighEvents(id: string, threshold = 100) {
    try {
      this.logger.info({ patientId: id, threshold }, 'getHighEvents called');
      this.ensurePatient(id);

      if (threshold < 0) {
        this.logger.warn({ patientId: id, threshold }, 'invalid threshold');
        throw AppError.badRequest(ErrCode.INVALID_THRESHOLD, { threshold });
      }

      const events = this.hrRepo
        .getByPatient(id)
        .filter(
          (r) =>
            Number.isFinite(Date.parse(r.timestamp)) && r.heartRate > threshold,
        )
        .map((r) => ({ timestamp: r.timestamp, heartRate: r.heartRate }));

      this.logger.info(
        { patientId: id, count: events.length },
        'high events computed',
      );
      return { patientId: id, events, count: events.length };
    } catch (e) {
      if (e instanceof AppError) throw e;
      this.logger.error(
        { err: e, patientId: id, threshold },
        'getHighEvents failed',
      );
      throw AppError.internal({ patientId: id, threshold });
    }
  }

  getAnalytics(id: string, from: string, to: string) {
    try {
      this.logger.info({ patientId: id, from, to }, 'getAnalytics called');
      this.ensurePatient(id);
      assertValidWindow(from, to, id, this.logger);

      const values = this.hrRepo
        .getByPatient(id)
        .filter((r) => inRange(r.timestamp, from, to))
        .map((r) => r.heartRate);

      if (!values.length) {
        this.logger.info({ patientId: id, from, to }, 'no readings in window');
        return {
          patientId: id,
          from,
          to,
          count: 0,
          avg: null,
          min: null,
          max: null,
        };
      }

      const sum = values.reduce((a, b) => a + b, 0);
      const avg = Math.round((sum / values.length) * 100) / 100;
      const out = {
        patientId: id,
        from,
        to,
        count: values.length,
        avg,
        min: Math.min(...values),
        max: Math.max(...values),
      };
      this.logger.info(
        {
          patientId: id,
          count: out.count,
          min: out.min,
          max: out.max,
          avg: out.avg,
        },
        'analytics computed',
      );
      return out;
    } catch (e) {
      if (e instanceof AppError) throw e;
      this.logger.error(
        { err: e, patientId: id, from, to },
        'getAnalytics failed',
      );
      throw AppError.internal({ patientId: id, from, to });
    }
  }
}
