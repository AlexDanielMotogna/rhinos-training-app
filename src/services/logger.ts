/**
 * Centralized Logging Utility
 *
 * Replaces all console.log/error/warn statements with environment-aware logging
 * - Development: Logs to console
 * - Production: Sends to Sentry
 *
 * Usage:
 *   import { logger } from './services/logger';
 *   logger.debug('Debug info', { data });
 *   logger.info('User logged in', { userId });
 *   logger.warn('Slow API response', { duration });
 *   logger.error('Failed to save', error, { context });
 */

import * as Sentry from '@sentry/react';

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
    this.isDevelopment = import.meta.env.DEV;
    this.isProduction = import.meta.env.PROD;

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
      'apiKey',
      'api_key',
      'jwt',
      'cookie',
      'session',
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
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context, null, 2) : '';
    return `[${timestamp}] [${level}] ${message}${contextStr ? '\n' + contextStr : ''}`;
  }

  /**
   * DEBUG: Detailed information for development debugging
   * Only logged in development mode
   */
  debug(message: string, context?: LogContext): void {
    if (LogLevel.DEBUG < this.minLevel) return;

    if (this.isDevelopment) {
      const scrubbed = this.scrubSensitiveData(context);
      console.log(`🔍 ${message}`, scrubbed || '');
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
      console.info(`ℹ️ ${message}`, scrubbed || '');
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
      console.warn(`⚠️ ${message}`, scrubbed || '');
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
      console.error(`❌ ${message}`, error, scrubbed || '');
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
   * API Request logging (development only)
   */
  apiRequest(method: string, url: string, context?: LogContext): void {
    if (!this.isDevelopment) return;

    const scrubbed = this.scrubSensitiveData(context);
    console.log(`📤 [API] ${method} ${url}`, scrubbed || '');
  }

  /**
   * API Response logging (development only)
   */
  apiResponse(method: string, url: string, status: number, context?: LogContext): void {
    if (!this.isDevelopment) return;

    const scrubbed = this.scrubSensitiveData(context);
    const emoji = status >= 200 && status < 300 ? '✅' : status >= 400 ? '❌' : '📥';
    console.log(`${emoji} [API] ${method} ${url} - ${status}`, scrubbed || '');
  }

  /**
   * Performance timing
   */
  time(label: string): void {
    if (!this.isDevelopment) return;
    console.time(`⏱️ ${label}`);
  }

  timeEnd(label: string): void {
    if (!this.isDevelopment) return;
    console.timeEnd(`⏱️ ${label}`);
  }

  /**
   * Group logs together (development only)
   */
  group(label: string): void {
    if (!this.isDevelopment) return;
    console.group(label);
  }

  groupEnd(): void {
    if (!this.isDevelopment) return;
    console.groupEnd();
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logDebug = logger.debug.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);
