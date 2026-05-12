import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse();

    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const reqId = request['reqId'] || 'N/A';

    const message =
      exception?.response?.message ||
      exception.message ||
      'Internal server error';

    // Log the error with request ID
    if (status >= 500) {
      this.logger.error(
        `[${reqId}] ${request.method} ${request.url} - ${status} - ${message}`,
        exception.stack,
      );
    } else {
      this.logger.warn(
        `[${reqId}] ${request.method} ${request.url} - ${status} - ${message}`,
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