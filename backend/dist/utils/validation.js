"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateIndianMobile = validateIndianMobile;
exports.safeParseJsonArray = safeParseJsonArray;
/**
 * Validates Indian mobile numbers.
 * Requirements:
 * - Accept numeric digits (stripping optional country code / formatting symbols)
 * - Raw digit count must be between 10 and 12 digits
 * - Reject invalid lengths or non-numeric inputs with clear message:
 *   "Please enter a valid Indian mobile number using 10–12 digits."
 */
function validateIndianMobile(phone) {
    if (!phone || !phone.trim()) {
        return { isValid: false, message: 'Mobile number is required.' };
    }
    const raw = phone.trim();
    const digitsOnly = raw.replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 12) {
        return {
            isValid: false,
            message: 'Please enter a valid Indian mobile number using 10–12 digits.',
        };
    }
    return {
        isValid: true,
        cleanPhone: `+${digitsOnly}`,
    };
}
/**
 * Safely parses a string or array into a string array.
 * Prevents SyntaxError exceptions when serviceTypes in DB is stored as:
 * - JSON string e.g. '["LOANS", "INSURANCE"]'
 * - Comma-separated string e.g. 'LOANS,INSURANCE' or 'LOANS'
 * - Already an array e.g. ['LOANS', 'INSURANCE']
 * - null, undefined, or empty string
 */
function safeParseJsonArray(input) {
    if (!input)
        return [];
    if (Array.isArray(input))
        return input.map((item) => String(item).trim()).filter(Boolean);
    if (typeof input !== 'string')
        return [];
    const trimmed = input.trim();
    if (!trimmed)
        return [];
    try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
            return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
        if (typeof parsed === 'string') {
            return parsed.split(',').map((item) => item.trim()).filter(Boolean);
        }
    }
    catch (_e) {
        // If JSON parsing fails (e.g. invalid JSON or plain string like "LOANS,INSURANCE" or "LOANS")
    }
    // Fallback: split by comma and remove any leading/trailing quotes or brackets
    const cleaned = trimmed.replace(/^[\["'\s]+|[\]"'\s]+$/g, '');
    return cleaned
        .split(',')
        .map((s) => s.replace(/["'\s]/g, '').trim())
        .filter(Boolean);
}
