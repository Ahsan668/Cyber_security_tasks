
# BunchOfFriendsJS — Secured Version

This project is a social networking web application originally designed to be intentionally insecure for educational purposes. Over the course of a 3-week cybersecurity internship, the app was fully assessed, hardened, and documented to address major security risks.

---

## 🚀 Quick Start

1. **Install dependencies:**
	```bash
	npm install
	```
2. **Build the project:**
	```bash
	npm run build
	```
3. **Start the server:**
	```bash
	npm start
	```
4. Open your browser to [http://localhost:3000/](http://localhost:3000/)

---

## 🔐 Security Improvements (2026)

- Passwords are now hashed with bcrypt (no plain text storage)
- SQL injection vulnerabilities fixed (input validation, escaping)
- XSS (Cross-Site Scripting) mitigated (output encoding, sanitization)
- Input validation for all user data
- Security headers set with Helmet.js
- Security logging with Winston (all events logged to `security.log`)
- All major [OWASP Top 10](https://owasp.org/www-project-top-ten/) risks addressed

See `SECURITY_IMPLEMENTATION.md` and `SECURITY_REPORT_WEEK2_WEEK3.md` for full details.

---

## 📂 Project Structure

- `src/` — Application source code (routes, security, ORM, etc.)
- `bin/` — Startup scripts
- `dist/` — Compiled output
- `static/` — CSS and static assets
- `views/` — EJS templates
- `security.log` — Security event log (not tracked in git)
- `error.log` — Error log (not tracked in git)

---

## 📝 Documentation

- `SECURITY_IMPLEMENTATION.md` — Implementation guide
- `SECURITY_REPORT_WEEK2_WEEK3.md` — Vulnerability analysis & fixes
- `SECURITY_CHECKLIST.md` — Checklist of all security tasks
- `FINAL_SUBMISSION_REPORT.md` — Project summary and results

---

## ⚠️ Notes

- This repo is now safe to open and use with git. The `.gitignore` is hand-written and only excludes files that should not be tracked (logs, build output, node_modules, IDE settings, etc.).
- If you have issues opening this folder in git, make sure you are inside the `bunchoffriendsjs` directory and that `.git` exists here (it does by default after `git init`).
- No files or folders required for git are excluded by `.gitignore`.

---

## 📜 License

Originally: [Creative Commons Zero / Public Domain license](https://creativecommons.org/publicdomain/zero/1.0/)

---

**Project maintained and secured as part of a 2026 cybersecurity internship.**

