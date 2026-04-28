/*
 * Security Utilities for Week 2 Implementation
 * Handles password hashing, input validation, and SQL parameterization
 */

import bcrypt from 'bcrypt';
const validator = require('validator');

/**
 * PASSWORD HASHING
 * ================
 * Why: Passwords should NEVER be stored in plain text
 * If database is breached, attackers can't read passwords
 * bcrypt uses "salting" - adds random data to make rainbow tables useless
 */

export async function hashPassword(password: string): Promise<string> {
    // 10 = cost factor (higher = slower but more secure)
    // Takes ~100ms per hash - prevents brute force attacks
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
}

/**
 * PASSWORD VERIFICATION
 * ====================
 * Why: When user logs in, compare their input to stored hash
 * bcrypt.compare() is secure - doesn't expose the hash directly
 */

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * INPUT VALIDATION
 * ================
 * Why: Validates data BEFORE it enters the database
 * Prevents invalid data and some attack types
 */

export function validateEmail(email: string): boolean {
    // validator.isEmail() checks:
    // - Has @ symbol
    // - Has domain
    // - Has proper format
    return validator.isEmail(email);
}

export function validateUsername(username: string): boolean {
    // Username must be 3-20 alphanumeric characters
    // Prevents special characters that could break SQL queries
    return username.length >= 3 &&
           username.length <= 20 &&
           /^[a-zA-Z0-9_]+$/.test(username);
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
    // Password requirements:
    // - Minimum 8 characters (prevents weak passwords)
    // - At least one uppercase letter
    // - At least one number
    // - At least one special character

    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain uppercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain a number' };
    }
    if (!/[!@#$%^&*]/.test(password)) {
        return { valid: false, message: 'Password must contain special character (!@#$%^&*)' };
    }
    return { valid: true };
}

export function validateFullName(fullName: string): boolean {
    return fullName.length >= 2 && fullName.length <= 100;
}

/**
 * INPUT SANITIZATION
 * ==================
 * Why: Removes potentially dangerous characters
 * Example: If user enters "admin' OR '1'='1", sanitization helps prevent SQL injection
 */

export function sanitizeString(input: string): string {
    // trim() - removes leading/trailing spaces
    // escape() - converts special chars to safe versions
    return validator.escape(input.trim());
}

/**
 * OUTPUT ENCODING (XSS PREVENTION)
 * ===============================
 * Why: When displaying user-generated content, must encode HTML
 * Example: If user posts "<script>alert('xss')</script>"
 *          We display it as text, not execute it
 */

export function sanitizeHtmlOutput(dirty: string): string {
    // Use validator.escape() to safely encode HTML
    // Converts < > " ' & to HTML entities
    // This prevents script tags and HTML injection
    return validator.escape(dirty);
}

/**
 * PARAMETERIZED QUERY HELPER
 * ==========================
 * Why: Prevents SQL injection by separating SQL code from user data
 * Old way (vulnerable): `SELECT * FROM users WHERE id = ${userInput}`
 * New way (safe): Uses placeholders and parameter array
 */

export function createSafeQuery(query: string, params: any[] = []): { query: string; params: any[] } {
    return { query, params };
}

/**
 * DATABASE QUERY SANITIZATION
 * ============================
 * These helpers ensure numeric IDs are actually numbers
 * Prevents attackers from injecting SQL through numeric fields
 */

export function sanitizeId(id: any): number | null {
    const parsed = Number(id);
    // If parsing fails or value is not a safe integer, return null
    if (isNaN(parsed) || !Number.isSafeInteger(parsed) || parsed < 1) {
        return null;
    }
    return parsed;
}

export function sanitizeNumericField(value: any): number | null {
    const parsed = Number(value);
    if (isNaN(parsed) || !Number.isSafeInteger(parsed)) {
        return null;
    }
    return parsed;
}
