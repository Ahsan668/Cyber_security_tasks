/*
 * WARNING!
 *
 * This project is intentionally insecure.
 *
 * DO NOT use in production.
 *
 * It is designed for educational purposes - to teach common vulnerabilities in web applications.
 */

import Router from 'express-promise-router';
import { User } from '../orm';
import {
    validateUsername,
    validatePassword,
    validateFullName,
    sanitizeString
} from '../security';
import {
    logLoginSuccess,
    logLoginFailure,
    logSignup,
    logValidationError
} from '../logger';
const route = Router();

//--------------------------------------------------------
// Routes that are accessible by all users / guests
//--------------------------------------------------------

// Show the login form
route.get('/', (_req, res) => {
    res.render('index', { view: 'index' });
});

// Handle the login data posted from the home page
// Usernames are case insensitive
route.post('/login', async (req, res) => {
    const username = String(req.body.username || '').toLowerCase().trim();
    const password = String(req.body.password || '');

    const messages = [];

    // Validate username format
    if (username.length === 0) {
        messages.push('Username cannot be empty');
    }

    // Validate password format
    if (password.length === 0) {
        messages.push('Password cannot be empty');
    }

    // If validation errors, show them
    if (messages.length > 0) {
        return res.render('index', { view: 'index', messages });
    }

    // Attempt login with validated credentials
    const user = await User.byLogin(username, password);
    const clientIp = (req.ip as string) || 'unknown';
    if (user != null) {
        req.session.user = user;
        logLoginSuccess(username, clientIp);
        res.redirect(303, 'home');
    } else {
        // Don't reveal which field is wrong (prevents account enumeration)
        logLoginFailure(username, clientIp, 'Invalid credentials');
        res.render('index', { view: 'index', messages: ['Invalid username or password'] });
    }
});

// Form for signing up for a new account
route.get('/signup', (_req, res) => {
    res.render('signup', { view: 'signup' });
});

// Create a new account
// Validates all fields before storing in database
route.post('/signup', async (req, res) => {
    // Sanitize and validate all inputs
    const username = sanitizeString(String(req.body.username || '')).toLowerCase();
    const password = String(req.body.password || '');
    const fullName = sanitizeString(String(req.body.fullName || ''));

    const messages = [];

    // Validate username
    if (username.length === 0) {
        messages.push('Username cannot be empty');
    } else if (!validateUsername(username)) {
        messages.push('Username must be 3-20 characters (alphanumeric and underscores only)');
    }

    // Validate password
    if (password.length === 0) {
        messages.push('Password cannot be empty');
    } else {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            messages.push(passwordValidation.message);
        }
    }

    // Validate full name
    if (fullName.length === 0) {
        messages.push('Full name cannot be empty');
    } else if (!validateFullName(fullName)) {
        messages.push('Full name must be between 2 and 100 characters');
    }

    const clientIp = (req.ip as string) || 'unknown';
    try {
        // Are there any validation errors?
        if (messages.length === 0) {
            // No errors - create the new user with hashed password
            await new User(username, password, fullName).create();
            logSignup(username, clientIp);
            return res.render('signup_success', { view: 'signup_success' });
        } else {
            // Log validation errors
            messages.forEach(msg => {
                logValidationError('signup', msg, clientIp);
            });
        }
    } catch (e) {
        const errorMsg = (e && e.message) || 'An error occurred';
        messages.push(errorMsg);
        logValidationError('signup', errorMsg, clientIp);
    }

    // Return to signup form with errors (don't show password)
    res.render('signup', { view: 'signup', username, fullName, messages });
});

// Remove the currently logged in user from the session
route.get('/logout', (req, res) => {
    delete req.session.user;
    res.redirect(303, '/');
});

export default route;