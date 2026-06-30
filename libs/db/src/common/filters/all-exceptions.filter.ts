import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errorName = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = (res as any).message || exception.message;
        errorName = (res as any).error || exception.name;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorName = exception.name;
      // Postgres unique violation
      if ((exception as any).code === '23505') {
        status = HttpStatus.CONFLICT;
        message = 'A record with this value already exists';
        errorName = 'ConflictError';
      }
      // Postgres foreign key violation
      if ((exception as any).code === '23503') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Referenced record does not exist';
        errorName = 'ForeignKeyViolation';
      }
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      error: errorName,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
