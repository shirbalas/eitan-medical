import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PatientsRepository } from '../patients/repositories/patients.repository';
import { HeartRateRepository } from '../heart-rate/repositories/heart-rate.repository';

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly log = new Logger(SeederService.name);

  constructor(
    private readonly patientsRepo: PatientsRepository,
    private readonly heartRepo: HeartRateRepository,
  ) {}

  onModuleInit() {
    try {
      let p = path.join(__dirname, 'patients.json');
      if (!fs.existsSync(p)) {
        const alt = path.join(process.cwd(), 'src', 'seed', 'patients.json');
        if (fs.existsSync(alt)) p = alt;
      }

      const raw = fs.readFileSync(p, 'utf-8');
      const data = JSON.parse(raw) as {
        patients?: any[];
        heartRateReadings?: any[];
      };

      this.patientsRepo.upsertMany(data.patients ?? []);
      this.heartRepo.upsertMany(data.heartRateReadings ?? []);
      this.log.log(`Seeded ${this.patientsRepo.findAll().length} patients`);
    } catch (err) {
      this.log.error('Failed to seed initial data', err);
    }
  }
}
