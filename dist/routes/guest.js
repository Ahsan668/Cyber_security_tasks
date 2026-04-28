"use strict";
/*
 * WARNING!
 *
 * This project is intentionally insecure.
 *
 * DO NOT use in production.
 *
 * It is designed for educational purposes - to teach common vulnerabilities in web applications.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_promise_router_1 = __importDefault(require("express-promise-router"));
const orm_1 = require("../orm");
const security_1 = require("../security");
const logger_1 = require("../logger");
const route = express_promise_router_1.default();
//--------------------------------------------------------
// Routes that are accessible by all users / guests
//--------------------------------------------------------
// Show the login form
route.get('/', (_req, res) => {
    res.render('index', { view: 'index' });
});
// Handle the login data posted from the home page
// Usernames are case insensitive
route.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const user = yield orm_1.User.byLogin(username, password);
    const clientIp = req.ip || 'unknown';
    if (user != null) {
        req.session.user = user;
        logger_1.logLoginSuccess(username, clientIp);
        res.redirect(303, 'home');
    }
    else {
        // Don't reveal which field is wrong (prevents account enumeration)
        logger_1.logLoginFailure(username, clientIp, 'Invalid credentials');
        res.render('index', { view: 'index', messages: ['Invalid username or password'] });
    }
}));
// Form for signing up for a new account
route.get('/signup', (_req, res) => {
    res.render('signup', { view: 'signup' });
});
// Create a new account
// Validates all fields before storing in database
route.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Sanitize and validate all inputs
    const username = security_1.sanitizeString(String(req.body.username || '')).toLowerCase();
    const password = String(req.body.password || '');
    const fullName = security_1.sanitizeString(String(req.body.fullName || ''));
    const messages = [];
    // Validate username
    if (username.length === 0) {
        messages.push('Username cannot be empty');
    }
    else if (!security_1.validateUsername(username)) {
        messages.push('Username must be 3-20 characters (alphanumeric and underscores only)');
    }
    // Validate password
    if (password.length === 0) {
        messages.push('Password cannot be empty');
    }
    else {
        const passwordValidation = security_1.validatePassword(password);
        if (!passwordValidation.valid) {
            messages.push(passwordValidation.message);
        }
    }
    // Validate full name
    if (fullName.length === 0) {
        messages.push('Full name cannot be empty');
    }
    else if (!security_1.validateFullName(fullName)) {
        messages.push('Full name must be between 2 and 100 characters');
    }
    const clientIp = req.ip || 'unknown';
    try {
        // Are there any validation errors?
        if (messages.length === 0) {
            // No errors - create the new user with hashed password
            yield new orm_1.User(username, password, fullName).create();
            logger_1.logSignup(username, clientIp);
            return res.render('signup_success', { view: 'signup_success' });
        }
        else {
            // Log validation errors
            messages.forEach(msg => {
                logger_1.logValidationError('signup', msg, clientIp);
            });
        }
    }
    catch (e) {
        const errorMsg = (e && e.message) || 'An error occurred';
        messages.push(errorMsg);
        logger_1.logValidationError('signup', errorMsg, clientIp);
    }
    // Return to signup form with errors (don't show password)
    res.render('signup', { view: 'signup', username, fullName, messages });
}));
// Remove the currently logged in user from the session
route.get('/logout', (req, res) => {
    delete req.session.user;
    res.redirect(303, '/');
});
exports.default = route;
//# sourceMappingURL=guest.js.map