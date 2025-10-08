import { Module } from '@nestjs/common';
import { HeartRateController } from './heart-rate.controller';
import { HeartRateService } from './heart-rate.service';
import { HeartRateRepository } from './repositories/heart-rate.repository';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [PatientsModule],
  controllers: [HeartRateController],
  providers: [HeartRateService, HeartRateRepository],
  exports: [HeartRateRepository],
})
export class HeartRateModule {}
