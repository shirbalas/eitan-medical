import { Injectable } from '@nestjs/common';
import { HeartRateReading } from '../entities/heart-rate-reading.entity';

@Injectable()
export class HeartRateRepository {
  private hrReadingsByPatient = new Map<string, HeartRateReading[]>();

  upsertMany(list: HeartRateReading[]) {
    const tmp = new Map<string, HeartRateReading[]>();
    for (const hr of list) {
      if (!tmp.has(hr.patientId)) tmp.set(hr.patientId, []);
      tmp.get(hr.patientId)!.push(hr);
    }
    for (const [pid, arr] of tmp) {
      arr.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      this.hrReadingsByPatient.set(pid, arr);
    }
  }
  getByPatient(id: string) {
    return this.hrReadingsByPatient.get(id) ?? [];
  }
}
