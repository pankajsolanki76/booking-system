import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const reqId = request['reqId'] || 'N/A';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    // Determine status and client-facing message
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseData = exception.getResponse();
      message =
        typeof responseData === 'object' &&
        responseData !== null &&
        'message' in responseData
          ? (responseData as any).message
          : exception.message;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'A record with the given data already exists.';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message =
            'Related record not found or foreign key constraint failed.';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found.';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = `Database request error: ${exception.code}`;
          break;
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid data provided.';
    }

    // Capture the original message for internal logging
    const internalLogMessage = exception.message || 'Unknown internal error';

    // Log the error with request ID securely
    if (status >= 500) {
      this.logger.error(
        `[${reqId}] ${request.method} ${request.url} - ${status} - ${internalLogMessage}`,
        exception.stack,
      );
      // Ensure client only sees standard 500 msg, not internal details
      message = 'Internal server error';
    } else {
      this.logger.warn(
        `[${reqId}] ${request.method} ${request.url} - ${status} - ${internalLogMessage}`,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      reqId,
      message,
    });
  }
}
