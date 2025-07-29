// src/utils/logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile?: boolean;
}

class Logger {
  private config: LogConfig;

  constructor() {
    this.config = {
      level: __DEV__ ? 'debug' : 'error',
      enableConsole: __DEV__,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data, null, 2)}`;
    }
    return `${prefix} ${message}`;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug') && this.config.enableConsole) {
      console.log(this.formatMessage('debug', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info') && this.config.enableConsole) {
      console.info(this.formatMessage('info', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn') && this.config.enableConsole) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  error(message: string, error?: any): void {
    if (this.shouldLog('error') && this.config.enableConsole) {
      console.error(this.formatMessage('error', message, error));
    }
  }

  // API specific logging
  api(method: string, url: string, status?: number, data?: any): void {
    if (status && status >= 200 && status < 300) {
      this.info(`API ${method.toUpperCase()} ${url} - ${status}`, data);
    } else if (status) {
      this.error(`API ${method.toUpperCase()} ${url} - ${status}`, data);
    } else {
      this.debug(`API ${method.toUpperCase()} ${url}`, data);
    }
  }

  // Auth specific logging
  auth(action: string, data?: any): void {
    this.debug(`🔐 ${action}`, data);
  }

  // Location specific logging
  location(action: string, data?: any): void {
    this.debug(`📍 ${action}`, data);
  }

  // Search specific logging
  search(action: string, data?: any): void {
    this.debug(`🔍 ${action}`, data);
  }

  // Camera/Dashcam specific logging
  camera(action: string, data?: any): void {
    this.debug(`📷 ${action}`, data);
  }
}

export const logger = new Logger();

// Convenience functions
export const logDebug = (message: string, data?: any) => logger.debug(message, data);
export const logInfo = (message: string, data?: any) => logger.info(message, data);
export const logWarn = (message: string, data?: any) => logger.warn(message, data);
export const logError = (message: string, error?: any) => logger.error(message, error);
export const logApi = (method: string, url: string, status?: number, data?: any) => logger.api(method, url, status, data);
export const logAuth = (action: string, data?: any) => logger.auth(action, data);
export const logLocation = (action: string, data?: any) => logger.location(action, data);
export const logSearch = (action: string, data?: any) => logger.search(action, data);
export const logCamera = (action: string, data?: any) => logger.camera(action, data); 