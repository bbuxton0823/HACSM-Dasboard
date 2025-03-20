"use strict";
/**
 * Simple logger utility for the application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LogLevel = void 0;
/**
 * Log levels available in the application
 */
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "ERROR";
    LogLevel["WARN"] = "WARN";
    LogLevel["INFO"] = "INFO";
    LogLevel["DEBUG"] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Default logger configuration
 */
const defaultConfig = {
    logLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
    enableConsole: true,
};
/**
 * Checks if a log of the specified level should be written
 * based on the current log level configuration
 */
const shouldLog = (level, config = defaultConfig) => {
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
const formatLog = (level, message, meta) => {
    const timestamp = new Date().toISOString();
    let formattedMessage = `[${timestamp}] [${level}] ${message}`;
    if (meta) {
        try {
            const metaString = typeof meta === 'object'
                ? JSON.stringify(meta, null, 2)
                : String(meta);
            formattedMessage += `\n${metaString}`;
        }
        catch (err) {
            formattedMessage += `\n[Error serializing log metadata: ${err}]`;
        }
    }
    return formattedMessage;
};
/**
 * Core logging function
 */
const log = (level, message, meta, config = defaultConfig) => {
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
exports.logger = {
    error: (message, meta) => log(LogLevel.ERROR, message, meta),
    warn: (message, meta) => log(LogLevel.WARN, message, meta),
    info: (message, meta) => log(LogLevel.INFO, message, meta),
    debug: (message, meta) => log(LogLevel.DEBUG, message, meta),
};
