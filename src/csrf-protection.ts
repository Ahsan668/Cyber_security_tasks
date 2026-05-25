/*
 * CSRF Protection Module - Week 5
 * ================================
 * Implements Cross-Site Request Forgery (CSRF) protection
 *
 * What is CSRF?
 * ============
 * Attack where attacker tricks user into making unwanted requests
 * Example: User visits malicious website while logged in
 *          Website makes request to bank to transfer money
 *          Since user is logged in, bank processes request
 *
 * How CSRFProtection Works:
 * ========================
 * 1. Server generates unique token for each form
 * 2. Token is embedded in HTML form
 * 3. User sends form with token
 * 4. Server verifies token matches stored value
 * 5. Only legitimate requests from same origin have valid token
 */

import csrf from 'csurf';
import cookieParser from 'cookie-parser';
import session from 'express-session';

/**
 * Configure Session Middleware
 * Required for CSRF protection to store token
 */
export function configureSession(app: any) {
    app.use(session({
        secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
        resave: false,
        saveUninitialized: true,
        cookie: {
            httpOnly: true,      // Prevent JavaScript access
            secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
            sameSite: 'strict'   // Prevent CSRF attacks
        }
    }));
}

/**
 * CSRF Protection Middleware
 * Uses session-based token storage (more secure than cookie)
 */
const csrfProtection = csrf({
    cookie: false // Use session instead of cookie
});

/**
 * Middleware to generate CSRF token for GET requests
 * Generates token and stores in session
 */
export function generateCSRFToken(req: any, res: any, next: any) {
    // Generate and store token in session
    res.locals.csrfToken = req.csrfToken();
    next();
}

/**
 * Middleware to verify CSRF token for POST requests
 * Verifies token matches session value
 */
export function verifyCSRFToken(req: any, res: any, next: any) {
    csrfProtection(req, res, (err: any) => {
        if (err) {
            // CSRF token validation failed
            console.warn('CSRF token validation failed for:', req.ip);
            return res.status(403).json({
                error: 'CSRF token invalid or missing'
            });
        }
        // Token is valid, continue
        next();
    });
}

/**
 * Initialize CSRF Protection
 * Call this in main app setup
 */
export function setupCSRFProtection(app: any) {
    // Middleware stack
    app.use(csrfProtection);

    // Make token available in all templates
    app.use((req: any, res: any, next: any) => {
        res.locals.csrfToken = req.csrfToken();
        next();
    });

    console.log('✅ CSRF Protection configured');
}

/**
 * Helper function to validate CSRF in AJAX requests
 * For API calls, include token in X-CSRF-Token header
 */
export function validateAJAXCSRF(req: any, res: any, next: any) {
    const token = req.headers['x-csrf-token'] || req.body._csrf;

    if (!token) {
        return res.status(403).json({
            error: 'CSRF token missing'
        });
    }

    // Verify token
    try {
        csrfProtection(req, res, (err: any) => {
            if (err) {
                return res.status(403).json({
                    error: 'CSRF token invalid'
                });
            }
            next();
        });
    } catch (e) {
        return res.status(403).json({
            error: 'CSRF validation failed'
        });
    }
}

// ============================================================
// CSRF ATTACK EXAMPLES (Educational)
// ============================================================

/**
 * Example 1: Form-based CSRF Attack (Vulnerable without protection)
 *
 * WITHOUT CSRF PROTECTION:
 * Attacker creates malicious form on their website:
 *
 * <form action="http://yourbank.com/transfer" method="POST">
 *   <input name="amount" value="1000" />
 *   <input name="account" value="attacker-account" />
 * </form>
 * <script>document.forms[0].submit();</script>
 *
 * If user visits this page while logged into bank:
 * ✗ Bank processes transfer (user is authenticated)
 * ✗ Money transferred to attacker
 * ✗ User unaware of attack
 *
 * WITH CSRF PROTECTION:
 * Form also needs CSRF token:
 * <input type="hidden" name="_csrf" value="unique-token" />
 *
 * Attacker can't get valid token (only in legitimate domain)
 * ✓ Form submission fails without token
 * ✓ Malicious request rejected
 * ✓ User protected
 */

/**
 * Example 2: AJAX-based CSRF Attack (Vulnerable without protection)
 *
 * WITHOUT CSRF PROTECTION:
 * Attacker's JavaScript makes API call:
 *
 * fetch('/api/transfer', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     amount: 1000,
 *     account: 'attacker'
 *   })
 * });
 *
 * If user visits malicious site while logged in:
 * ✗ Browser includes authentication cookies
 * ✗ Request succeeds
 * ✗ Transfer completed
 *
 * WITH CSRF PROTECTION:
 * Request must include CSRF token header:
 *
 * fetch('/api/transfer', {
 *   method: 'POST',
 *   headers: {
 *     'X-CSRF-Token': document.getElementById('csrf-token').value
 *   },
 *   body: JSON.stringify({...})
 * });
 *
 * Attacker can't access token (same-origin policy)
 * ✓ Request rejected without valid token
 * ✓ API protected
 */

/**
 * Example 3: SameSite Cookie Protection
 *
 * Modern browsers also prevent CSRF via SameSite:
 *
 * Set-Cookie: sessionid=...; SameSite=Strict
 *
 * SameSite=Strict: Cookie not sent cross-site at all
 * SameSite=Lax: Cookie sent on cross-site GET only
 * SameSite=None: Cookie sent cross-site (requires Secure flag)
 *
 * Implementation: Cookies configured in session middleware
 */

// ============================================================
// EXPLOITATION TECHNIQUES (For Educational Testing)
// ============================================================

/**
 * How to test CSRF vulnerability:
 *
 * 1. Manual Testing:
 *    - Create HTML form on different domain
 *    - Try to submit form targeting your app
 *    - Without CSRF protection: succeeds
 *    - With CSRF protection: fails
 *
 * 2. Using Burp Suite:
 *    - Burp → Repeater → Edit → Change request origin
 *    - Try request from different domain
 *    - Without CSRF: succeeds
 *    - With CSRF: fails
 *
 * 3. Programmatic Testing:
 *    - Send POST without CSRF token header
 *    - Expected: 403 Forbidden
 */

/**
 * SQL Injection Prevention (Already Implemented in Week 2)
 *
 * Our implementation includes:
 * ✓ Quote escaping: ' becomes ''
 * ✓ ID validation: Must be safe integer
 * ✓ Parameterized approach: Separate code from data
 *
 * To verify SQL injection is prevented:
 * 1. Try login with: admin' OR '1'='1
 *    Expected: "Invalid username or password"
 *    NOT: Unauthorized access
 *
 * 2. Try login with: admin'; DROP TABLE users;--
 *    Expected: "Invalid username or password"
 *    NOT: Database error
 *
 * Tool: SQLMap can be used to test
 * Command: sqlmap -u "http://localhost:3000/login" --forms --dbs
 */

export default {
    configureSession,
    generateCSRFToken,
    verifyCSRFToken,
    setupCSRFProtection,
    validateAJAXCSRF
};
