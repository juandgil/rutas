import { injectable } from 'inversify';
import { ILogger } from '../../interfaces/services/logger.interface';
import { env } from '../config/env';

@injectable()
export class LoggerService implements ILogger {
  debug(message: string, meta?: any): void {
    if (env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, meta || '');
    }
  }

  info(message: string, meta?: any): void {
    console.info(`[INFO] ${message}`, meta || '');
  }

  warn(message: string, meta?: any): void {
    console.warn(`[WARN] ${message}`, meta || '');
  }

  error(message: string, error?: any): void {
    console.error(`[ERROR] ${message}`, error || '');
  }
} 