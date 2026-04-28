/*
 * Security Logging with Winston
 * ==============================
 * Logs all security-relevant events for monitoring and auditing
 * Helps detect attacks and suspicious behavior
 */

import winston from 'winston';
import path from 'path';

// Create logger instance
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        // Add timestamp to each log
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        // Add colors for console output
        winston.format.colorize(),
        // Custom format: timestamp [level] message metadata
        winston.format.printf((info: any) => {
            const { timestamp, level, message, ...metadata } = info;
            let meta = '';
            if (Object.keys(metadata).length > 0) {
                meta = JSON.stringify(metadata);
            }
            return `${timestamp} [${level}] ${message} ${meta}`;
        })
    ),
    transports: [
        // Log to console for real-time monitoring
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        // Log to file for persistent audit trail
        new winston.transports.File({
            filename: path.join(__dirname, '../security.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Log errors to separate file
        new winston.transports.File({
            filename: path.join(__dirname, '../error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5
        })
    ]
});

// ============================================================
// Security Event Logging Functions
// ============================================================

/**
 * Log successful login
 */
export function logLoginSuccess(username: string, ip: string): void {
    logger.info('User login successful', {
        username,
        ip,
        event: 'LOGIN_SUCCESS'
    });
}

/**
 * Log failed login attempt
 */
export function logLoginFailure(username: string, ip: string, reason: string): void {
    logger.warn('User login failed', {
        username,
        ip,
        reason,
        event: 'LOGIN_FAILURE'
    });
}

/**
 * Log new user registration
 */
export function logSignup(username: string, ip: string): void {
    logger.info('New user registered', {
        username,
        ip,
        event: 'SIGNUP'
    });
}

/**
 * Log user logout
 */
export function logLogout(username: string, ip: string): void {
    logger.info('User logout', {
        username,
        ip,
        event: 'LOGOUT'
    });
}

/**
 * Log validation errors
 */
export function logValidationError(field: string, value: string, ip: string): void {
    logger.warn('Input validation failed', {
        field,
        value: value.substring(0, 50), // Log only first 50 chars
        ip,
        event: 'VALIDATION_ERROR'
    });
}

/**
 * Log suspicious activity
 */
export function logSuspiciousActivity(activity: string, ip: string, details?: any): void {
    logger.warn('Suspicious activity detected', {
        activity,
        ip,
        details,
        event: 'SUSPICIOUS_ACTIVITY'
    });
}

/**
 * Log database errors
 */
export function logDatabaseError(error: string, query: string, ip: string): void {
    logger.error('Database error', {
        error,
        query: query.substring(0, 100), // Log only first 100 chars
        ip,
        event: 'DATABASE_ERROR'
    });
}

/**
 * Log application errors
 */
export function logApplicationError(error: string, ip: string, context?: string): void {
    logger.error('Application error', {
        error,
        ip,
        context,
        event: 'APPLICATION_ERROR'
    });
}

/**
 * Log security configuration changes
 */
export function logSecurityEvent(event: string, details: any): void {
    logger.info('Security event', {
        event,
        ...details
    });
}

export default logger;
