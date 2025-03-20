/**
 * Simple logger utility for the application
 */

/**
 * Log levels available in the application
 */
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  logLevel: LogLevel;
  enableConsole: boolean;
}

/**
 * Default logger configuration
 */
const defaultConfig: LoggerConfig = {
  logLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
};

/**
 * Checks if a log of the specified level should be written
 * based on the current log level configuration
 */
const shouldLog = (level: LogLevel, config: LoggerConfig = defaultConfig): boolean => {
  const logLevels = {
    [LogLevel.ERROR]: 0,
    [LogLevel.WARN]: 1,
    [LogLevel.INFO]: 2,
    [LogLevel.DEBUG]: 3,
  };

  return logLevels[level] <= logLevels[config.logLevel];
};

/**
 * Formats a log message
 */
const formatLog = (level: LogLevel, message: string, meta?: any): string => {
  const timestamp = new Date().toISOString();
  let formattedMessage = `[${timestamp}] [${level}] ${message}`;
  
  if (meta) {
    try {
      const metaString = typeof meta === 'object' 
        ? JSON.stringify(meta, null, 2) 
        : String(meta);
      formattedMessage += `\n${metaString}`;
    } catch (err) {
      formattedMessage += `\n[Error serializing log metadata: ${err}]`;
    }
  }
  
  return formattedMessage;
};

/**
 * Core logging function
 */
const log = (level: LogLevel, message: string, meta?: any, config: LoggerConfig = defaultConfig): void => {
  if (!shouldLog(level, config)) {
    return;
  }

  const formattedLog = formatLog(level, message, meta);
  
  if (config.enableConsole) {
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
      default:
        console.log(formattedLog);
    }
  }
  
  // Could add file logging or external logging service here
};

/**
 * Logger utility
 */
export const logger = {
  error: (message: string, meta?: any) => log(LogLevel.ERROR, message, meta),
  warn: (message: string, meta?: any) => log(LogLevel.WARN, message, meta),
  info: (message: string, meta?: any) => log(LogLevel.INFO, message, meta),
  debug: (message: string, meta?: any) => log(LogLevel.DEBUG, message, meta),
};
