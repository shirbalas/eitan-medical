import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from '../errors/app-error.error';
import { ErrCode, ERROR_MESSAGES } from '../errors/error-codes.error';

type HttpExceptionBody =
  | string
  | { message?: string | string[]; error?: string; statusCode?: number };

@Catch()
export class ProblemFilter implements ExceptionFilter {
  catch(e: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { log?: any }>();
    const res = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: ErrCode = ErrCode.INTERNAL_ERROR;
    let title = ERROR_MESSAGES[code];
    let detail: unknown;

    if (e instanceof AppError) {
      status = e.status;
      code = e.code;
      title = e.message || ERROR_MESSAGES[code];
      detail = e.details;
    } else if (e instanceof HttpException) {
      status = e.getStatus();
      const body = e.getResponse() as HttpExceptionBody;
      const msg: string | string[] | undefined =
        typeof body === 'string' ? body : body?.message;

      if (Array.isArray(msg)) {
        code = ErrCode.VALIDATION_FAILED;
        title = ERROR_MESSAGES[code];
        detail = msg;
      } else if (typeof msg === 'string' && msg.trim()) {
        title = msg;
      } else {
        title = ERROR_MESSAGES[code];
      }
    } else if (e instanceof Error) {
      detail = e.message;
    }

    if (req?.log && res) {
      const s =
        (typeof (e as any)?.status === 'number' && (e as any).status) ||
        res.statusCode ||
        status ||
        500;
      const level = s >= 500 ? 'error' : 'warn';
      req.log[level]({ err: e, status: s }, 'Request failed');
    }

    res.status(status).json({
      type: 'about:blank',
      title,
      status,
      instance: req.originalUrl,
      code,
      ...(detail !== undefined ? { detail } : {}),
    });
  }
}
