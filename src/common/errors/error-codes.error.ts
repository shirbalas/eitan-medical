export enum ErrCode {
  PATIENT_NOT_FOUND = 'PATIENT_NOT_FOUND',
  INVALID_TIME_WINDOW = 'INVALID_TIME_WINDOW',
  INVALID_THRESHOLD = 'INVALID_THRESHOLD',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export const ERROR_MESSAGES: Record<ErrCode, string> = {
  [ErrCode.PATIENT_NOT_FOUND]: 'Patient not found',
  [ErrCode.INVALID_TIME_WINDOW]: 'Invalid time window',
  [ErrCode.INVALID_THRESHOLD]: 'Invalid threshold',
  [ErrCode.VALIDATION_FAILED]: 'Validation failed',
  [ErrCode.INTERNAL_ERROR]: 'Internal Server Error',
};
