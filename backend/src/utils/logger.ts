/**
 * Centralized Backend Logging Utility
 *
 * Replaces all console.log/error/warn statements with environment-aware logging
 * - Development: Logs to console with colors
 * - Production: Sends to Sentry
 *
 * Usage:
 *   import { logger } from '../utils/logger';
 *   logger.debug('Debug info', { data });
 *   logger.info('User logged in', { userId });
 *   logger.warn('Slow query', { duration });
 *   logger.error('Failed to save', error, { context });
 */

import * as Sentry from '@sentry/node';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;
  private minLevel: LogLevel;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.isProduction = process.env.NODE_ENV === 'production';

    // In development, show everything. In production, only WARN and ERROR
    this.minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
  }

  /**
   * Scrub sensitive data from log context
   */
  private scrubSensitiveData(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;

    const scrubbed = { ...context };
    const sensitiveKeys = [
      'password',
      'token',
      'auth',
      'authorization',
      'secret',
      'apikey',
      'api_key',
      'jwt',
      'cookie',
      'session',
      'connectionstring',
      'database_url',
    ];

    // Recursively scrub sensitive keys
    const scrubObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;

      if (Array.isArray(obj)) {
        return obj.map(scrubObject);
      }

      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();

        if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
          cleaned[key] = '[REDACTED]';
        } else {
          cleaned[key] = scrubObject(value);
        }
      }
      return cleaned;
    };

    return scrubObject(scrubbed);
  }

  /**
   * Format log message with timestamp and level
   */
  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  /**
   * DEBUG: Detailed information for development debugging
   * Only logged in development mode
   */
  debug(message: string, context?: LogContext): void {
    if (LogLevel.DEBUG < this.minLevel) return;

    if (this.isDevelopment) {
      const scrubbed = this.scrubSensitiveData(context);
      console.log(this.formatMessage('DEBUG', message), scrubbed || '');
    }
  }

  /**
   * INFO: General informational messages
   * Logged in development, sent to Sentry in production (as breadcrumbs)
   */
  info(message: string, context?: LogContext): void {
    if (LogLevel.INFO < this.minLevel) return;

    const scrubbed = this.scrubSensitiveData(context);

    if (this.isDevelopment) {
      console.info(this.formatMessage('INFO', message), scrubbed || '');
    }

    if (this.isProduction) {
      // In production, add as breadcrumb (doesn't create Sentry issue)
      Sentry.addBreadcrumb({
        message,
        level: 'info',
        data: scrubbed,
      });
    }
  }

  /**
   * WARN: Warning messages that don't stop execution
   * Logged everywhere, sent to Sentry in production
   */
  warn(message: string, context?: LogContext): void {
    if (LogLevel.WARN < this.minLevel) return;

    const scrubbed = this.scrubSensitiveData(context);

    if (this.isDevelopment) {
      console.warn(this.formatMessage('WARN', message), scrubbed || '');
    }

    if (this.isProduction) {
      Sentry.captureMessage(message, {
        level: 'warning',
        extra: scrubbed,
      });
    }
  }

  /**
   * ERROR: Error messages
   * Always logged, sent to Sentry in production
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (LogLevel.ERROR < this.minLevel) return;

    const scrubbed = this.scrubSensitiveData(context);

    if (this.isDevelopment) {
      console.error(this.formatMessage('ERROR', message), error, scrubbed || '');
    }

    if (this.isProduction) {
      if (error instanceof Error) {
        Sentry.captureException(error, {
          contexts: {
            custom: {
              message,
              ...scrubbed,
            },
          },
        });
      } else {
        Sentry.captureMessage(message, {
          level: 'error',
          extra: {
            error,
            ...scrubbed,
          },
        });
      }
    }
  }

  /**
   * HTTP Request logging (development only)
   */
  httpRequest(method: string, path: string, context?: LogContext): void {
    if (!this.isDevelopment) return;

    const scrubbed = this.scrubSensitiveData(context);
    console.log(this.formatMessage('HTTP', `${method} ${path}`), scrubbed || '');
  }

  /**
   * HTTP Response logging (development only)
   */
  httpResponse(method: string, path: string, status: number, duration: number): void {
    if (!this.isDevelopment) return;

    const emoji = status >= 200 && status < 300 ? '✅' : status >= 400 ? '❌' : '📥';
    console.log(
      this.formatMessage('HTTP', `${emoji} ${method} ${path} - ${status} (${duration}ms)`)
    );
  }

  /**
   * Database query logging (development only)
   */
  dbQuery(query: string, duration: number): void {
    if (!this.isDevelopment) return;

    // Truncate long queries
    const truncated = query.length > 100 ? query.substring(0, 100) + '...' : query;
    console.log(this.formatMessage('DB', `Query executed in ${duration}ms: ${truncated}`));
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logDebug = logger.debug.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);
