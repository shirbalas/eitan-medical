import { AppError } from '../../common/errors/app-error.error';
import { ErrCode } from '../../common/errors/error-codes.error';
import { PinoLogger } from 'nestjs-pino';

export function inRange(tsISO: string, from?: string, to?: string) {
  const t = Date.parse(tsISO);
  if (Number.isNaN(t)) return false;
  if (from && t < Date.parse(from)) return false;
  if (to && t > Date.parse(to)) return false;
  return true;
}

export function assertValidWindow(
  from?: string,
  to?: string,
  patientId?: string,
  logger?: PinoLogger,
) {
  if (!from || !to) return;
  const f = Date.parse(from);
  const t = Date.parse(to);
  if (Number.isNaN(f) || Number.isNaN(t) || f > t) {
    logger?.warn({ patientId, from, to }, 'invalid time window');
    throw AppError.badRequest(
      ErrCode.INVALID_TIME_WINDOW,
      { from, to },
      'from must be <= to',
    );
  }
}
