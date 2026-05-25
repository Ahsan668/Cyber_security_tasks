/*
 * WARNING!
 *
 * This project is intentionally insecure.
 *
 * DO NOT use in production.
 *
 * It is designed for educational purposes - to teach common vulnerabilities in web applications.
 */

import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
const helmet = require('helmet');
import insecureSession from './sessions';
import { initialize } from './orm';
import guest from './routes/guest';
import unsecured from './routes/unsecured';
import secured from './routes/secured';
import logger from './logger';
import {
    setupAPISecurity,
    loginLimiter,
    signupLimiter,
    apiLimiter
} from './api-security';
import { exit } from 'process';

const app = express();
let port = 3000;
let bind = '127.0.0.1';

//--------------------------------------------------------
// Parse command line parameters
//--------------------------------------------------------

const portArg = process.argv.indexOf('--port');
if (portArg != -1) {
    if (portArg + 1 >= process.argv.length) {
        console.error('No value supplied for --port parameter');
        exit(1);
    }
    port = parseInt(process.argv[portArg + 1]);
    if (isNaN(port) || port < 1) {
        console.error('Missing or invalid value supplied for --port parameter');
        exit(1);
    }
}

if (process.argv.includes('--public')) {
    bind = '0.0.0.0';
    console.error('');
    console.error('* DANGER! DANGER! DANGER! DANGER! DANGER! DANGER! DANGER!');
    console.error('* ');
    console.error('* The --public parameter was supplied.');
    console.error('* This server is accessible on your network.');
    console.error('* Your filesystem may be vulnerable.');
    console.error('* ');
    console.error('* DANGER! DANGER! DANGER! DANGER! DANGER! DANGER! DANGER!');
    console.error('');
}

console.log('Bunch of Friends is an intentionally insecure application.');
console.log('It should not be used in production.');
console.log('It should only be used behind a secure firewall.');
console.log();

logger.info('Application starting with security enhancements applied');

//--------------------------------------------------------
// Start Express
//--------------------------------------------------------

// Use the EJS view engine
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

// Apply security headers with Helmet.js
// This prevents multiple attack types:
// - X-Frame-Options: Prevents clickjacking
// - X-Content-Type-Options: Prevents MIME-type sniffing
// - Strict-Transport-Security: Enforces HTTPS
// - Content-Security-Policy: Restricts resource loading
app.use(helmet());

// Setup API Security (Week 4)
// - Rate limiting to prevent brute force
// - CORS configuration to restrict API access
// - Enhanced CSP headers for script injection prevention
setupAPISecurity(app);

// Parse cookies and HTML forms
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));

// Use an insecure cookie-based session manager
app.use(insecureSession());

// Serve the static files
app.use(express.static(path.join(__dirname, '../static')));

// Configure application routes
app.use(guest);
app.use(unsecured);
app.use(secured);

// Handle any uncaught errors from the application
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err) {
        res.status(500).render('error', { ...req.session, view: 'error', error: err.toString()});
    } else
        next();
});

// Start the server
async function start() {
    // Initialize the in-memory database and sample data
    await initialize();

    // Start express
    app.listen(
        port,
        bind,
        () => {
            const message = `Server started on ${bind}:${port}`;
            console.log(`Bunch of friends is running on interface ${bind}, port ${port}`);
            console.log(`Open your browser to http://localhost:${port}/`);
            logger.info(message, { bind, port, security: 'enabled' });
        }
    );
}

module.exports = { start };
