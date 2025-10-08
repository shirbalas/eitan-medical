import { PatientGender } from 'src/common/enums/patient-gender.enum';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: PatientGender;
}
