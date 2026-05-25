/*
 * API Security Module - Week 4
 * ============================
 * Implements:
 * 1. Rate Limiting - Prevent brute force attacks
 * 2. CORS Configuration - Restrict API access
 * 3. Enhanced CSP Headers - Prevent script injection
 */

import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';

// ============================================================
// 1. RATE LIMITING - Prevent Brute Force Attacks
// ============================================================

/**
 * General API Rate Limiter
 * Limits each IP to 100 requests per 15 minutes
 *
 * Purpose: Prevents brute force attacks and DDoS
 * Applies to: All routes by default
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health';
    }
});

/**
 * Login Rate Limiter
 * Much stricter: 5 attempts per 15 minutes
 *
 * Purpose: Prevent brute force password attacks
 * Applies to: /login endpoint specifically
 */
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per 15 minutes
    message: 'Too many login attempts. Please try again in 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
    keyGenerator: (req) => {
        // Use both IP and username to prevent username enumeration
        const username = req.body.username || 'unknown';
        return `${req.ip}-${username}`;
    }
});

/**
 * Signup Rate Limiter
 * Moderate: 10 attempts per hour
 *
 * Purpose: Prevent account creation spam
 * Applies to: /signup endpoint
 */
export const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 signup attempts per hour
    message: 'Too many accounts created from this IP. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * API Endpoint Rate Limiter
 * Strict for API endpoints: 50 requests per minute
 *
 * Purpose: Protect API from being overwhelmed
 * Applies to: /api/* routes
 */
export const apiEndpointLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 50, // Limit each IP to 50 requests per minute
    message: 'API rate limit exceeded. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

// ============================================================
// 2. CORS CONFIGURATION - Restrict API Access
// ============================================================

/**
 * CORS Options for Production
 *
 * What is CORS?
 * Cross-Origin Resource Sharing allows/denies requests from other domains
 *
 * Default: Only allow requests from same origin
 * This prevents unauthorized API access from malicious websites
 */
const corsOptions = {
    // Only allow requests from your own domain
    origin: process.env.ALLOWED_ORIGINS || ['http://localhost:3000'],

    // Allow credentials (cookies, auth headers)
    credentials: true,

    // Allowed HTTP methods
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],

    // Allowed request headers
    allowedHeaders: ['Content-Type', 'Authorization'],

    // Headers to expose to client
    exposedHeaders: ['X-Total-Count'],

    // Cache preflight for 24 hours
    maxAge: 86400
};

/**
 * Configure CORS for the application
 *
 * Development: Allows localhost
 * Production: Configure via environment variable
 */
export function configureCORS(app: any) {
    if (process.env.NODE_ENV === 'production') {
        // Strict in production
        app.use(cors(corsOptions));
    } else {
        // Allow localhost in development
        app.use(cors({
            origin: 'http://localhost:3000',
            credentials: true
        }));
    }
}

// ============================================================
// 3. ENHANCED CSP HEADERS - Prevent Script Injection
// ============================================================

/**
 * Configure Enhanced Content Security Policy
 *
 * CSP works by whitelisting resources that can be loaded
 * If script tries to load from non-whitelisted source, it's blocked
 *
 * Example:
 * - Allows scripts from 'self' (your own domain) only
 * - Blocks all inline scripts
 * - Blocks eval()
 */
export function configureEnhancedCSP(app: any) {
    app.use(
        helmet.contentSecurityPolicy({
            directives: {
                // Default: restrict everything to 'self'
                defaultSrc: ["'self'"],

                // Scripts: only from same origin, no inline
                scriptSrc: ["'self'"],

                // Styles: only from same origin (allow unsafe-inline for now)
                styleSrc: ["'self'", "'unsafe-inline'"],

                // Images: allow from anywhere (safe)
                imgSrc: ["'self'", 'data:', 'https:'],

                // Fonts: only from same origin
                fontSrc: ["'self'"],

                // Connections: restrict API calls
                connectSrc: ["'self'"],

                // Framing: prevent clickjacking
                frameSrc: ["'none'"],

                // Object embeds: disable
                objectSrc: ["'none'"],

                // Base URI: restrict to same origin
                baseUri: ["'self'"],

                // Form actions: restrict to same origin
                formAction: ["'self'"],

                // Upgrade insecure requests to HTTPS
                upgradeInsecureRequests: true as any
            },

        })
    );
}

// ============================================================
// 4. ADDITIONAL SECURITY HEADERS
// ============================================================

/**
 * Configure Additional Security Headers
 *
 * Headers implemented:
 * - X-Content-Type-Options: Prevent MIME sniffing
 * - X-Frame-Options: Prevent clickjacking
 * - X-XSS-Protection: Browser XSS filter
 * - Strict-Transport-Security: Force HTTPS
 * - Referrer-Policy: Control referrer information
 */
export function configureSecurityHeaders(app: any) {
    // X-Content-Type-Options: Prevent MIME type sniffing
    app.use((req: any, res: any, next: any) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        next();
    });

    // X-Frame-Options: Prevent clickjacking
    app.use((req: any, res: any, next: any) => {
        res.setHeader('X-Frame-Options', 'DENY');
        next();
    });

    // X-XSS-Protection: Enable browser XSS filter
    app.use((req: any, res: any, next: any) => {
        res.setHeader('X-XSS-Protection', '1; mode=block');
        next();
    });

    // Strict-Transport-Security: Force HTTPS
    app.use((req: any, res: any, next: any) => {
        res.setHeader(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
        );
        next();
    });

    // Referrer-Policy: Limit referrer information
    app.use((req: any, res: any, next: any) => {
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        next();
    });

    // Remove X-Powered-By header (prevents fingerprinting)
    app.disable('x-powered-by');
}

// ============================================================
// 5. REQUEST VALIDATION MIDDLEWARE
// ============================================================

/**
 * Validate Content-Type header
 * Ensures API receives correct content type
 */
export function validateContentType(req: any, res: any, next: any) {
    if (req.method === 'POST' || req.method === 'PUT') {
        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('application/x-www-form-urlencoded')) {
            return res.status(400).json({
                error: 'Invalid Content-Type. Expected application/x-www-form-urlencoded'
            });
        }
    }
    next();
}

/**
 * Validate User-Agent header
 * Prevents requests from suspicious clients
 */
export function validateUserAgent(req: any, res: any, next: any) {
    const userAgent = req.headers['user-agent'];

    if (!userAgent) {
        // Some legitimate tools don't send User-Agent
        // But we can log them for monitoring
        console.warn('Request without User-Agent header:', req.ip);
    }

    // Block known malicious user agents
    const blockedAgents = ['sqlmap', 'nikto', 'nmap', 'curl'];
    const lowerUA = userAgent ? userAgent.toLowerCase() : '';

    for (const agent of blockedAgents) {
        if (lowerUA.includes(agent)) {
            return res.status(403).json({
                error: 'Access denied'
            });
        }
    }

    next();
}

// ============================================================
// 6. SETUP FUNCTION - Call this in main app file
// ============================================================

/**
 * Initialize all API security measures
 * Call this in your Express app setup (src/index.ts)
 *
 * Example:
 * import { setupAPISecurity } from './api-security';
 *
 * // In your Express setup:
 * setupAPISecurity(app);
 */
export function setupAPISecurity(app: any) {
    // 1. Configure CORS first
    configureCORS(app);

    // 2. Add security headers
    configureSecurityHeaders(app);

    // 3. Configure enhanced CSP
    configureEnhancedCSP(app);

    // 4. Add request validation
    app.use(validateUserAgent);

    console.log('✅ API Security measures configured');
}

export default {
    apiLimiter,
    loginLimiter,
    signupLimiter,
    apiEndpointLimiter,
    configureCORS,
    configureEnhancedCSP,
    configureSecurityHeaders,
    validateContentType,
    validateUserAgent,
    setupAPISecurity
};
