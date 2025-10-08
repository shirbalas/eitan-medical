import { ErrCode, ERROR_MESSAGES } from './error-codes.error';

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrCode,
    message?: string,
    public readonly details?: unknown,
  ) {
    super(message ?? ERROR_MESSAGES[code]);
  }

  static badRequest(code: ErrCode, details?: unknown, msg?: string) {
    return new AppError(400, code, msg, details);
  }
  static notFound(code: ErrCode, details?: unknown, msg?: string) {
    return new AppError(404, code, msg, details);
  }
  static internal(details?: unknown, msg?: string) {
    return new AppError(500, ErrCode.INTERNAL_ERROR, msg, details);
  }
}
