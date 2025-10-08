import { Injectable } from '@nestjs/common';
import { Patient } from '../entities/patient.entity';

@Injectable()
export class PatientsRepository {
  private patientsById = new Map<string, Patient>();
  private requestCounts = new Map<string, number>();

  upsertMany(list: Patient[]) {
    list.forEach(p => this.patientsById.set(p.id, p));
  }
  findAll(): Patient[] {
    return [...this.patientsById.values()];
  }
  findById(id: string): Patient | undefined {
    return this.patientsById.get(id);
  }

  incRequestCount(id: string) {
    if (!this.patientsById.has(id)) return;
    this.requestCounts.set(id, (this.requestCounts.get(id) ?? 0) + 1);
  }
  getRequestCount(id: string) {
    return this.requestCounts.get(id) ?? 0;
  }
}
