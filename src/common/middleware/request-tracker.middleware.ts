import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PatientsRepository } from '../../patients/repositories/patients.repository';

@Injectable()
export class PatientRequestTrackerMiddleware implements NestMiddleware {
  constructor(private readonly repo: PatientsRepository) {}
  use(req: Request, res: Response, next: NextFunction) {
    if (req.method !== 'GET') return next();

    const m = req.path.match(/^\/patients\/([^\/]+)(?:\/(.*))?$/);
    const id = m?.[1];
    const rest = m?.[2] ?? '';

    const isRequestsEndpoint = rest === 'requests';
    const isPatientProfile = rest === '';
    const isHeartRatePath = rest.startsWith('heart-rate');

    if (id && (isPatientProfile || isHeartRatePath) && !isRequestsEndpoint) {
      this.repo.incRequestCount(id);
    }

    next();
  }
}
