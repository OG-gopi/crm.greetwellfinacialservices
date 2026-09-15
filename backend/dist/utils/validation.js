"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateIndianMobile = validateIndianMobile;
exports.safeParseJsonArray = safeParseJsonArray;
exports.checkDuplicateUserOrInvite = checkDuplicateUserOrInvite;
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
/**
 * Checks if an email address or mobile phone number already exists in User or Invitation database.
 * Prevents duplicate emails and duplicate mobile numbers across all roles.
 */
async function checkDuplicateUserOrInvite(prismaClient, email, phone, excludeUserId) {
    const cleanEmail = email.trim().toLowerCase();
    // 1. Check duplicate email in User table
    const existingUserEmail = await prismaClient.user.findFirst({
        where: {
            email: cleanEmail,
            ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
        },
    });
    if (existingUserEmail) {
        return {
            isDuplicate: true,
            message: `A user account with email address '${cleanEmail}' already exists in the system. Duplicate email addresses are strictly prohibited.`,
        };
    }
    // 2. Check duplicate email in Invitation table
    const existingInviteEmail = await prismaClient.invitation.findFirst({
        where: {
            email: cleanEmail,
            status: { in: ['PENDING', 'INVITATION_SENT'] },
        },
    });
    if (existingInviteEmail) {
        return {
            isDuplicate: true,
            message: `An active invitation has already been issued to email address '${cleanEmail}'. Duplicate invitations are prohibited.`,
        };
    }
    // 3. Check duplicate mobile phone number if provided
    if (phone && phone.trim() && phone.trim() !== 'N/A') {
        const rawPhone = phone.trim();
        const digitsOnly = rawPhone.replace(/\D/g, '');
        if (digitsOnly.length >= 10) {
            const last10Digits = digitsOnly.slice(-10);
            // Check User table for phone
            const existingUserPhone = await prismaClient.user.findFirst({
                where: {
                    phone: { contains: last10Digits },
                    ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
                },
            });
            if (existingUserPhone) {
                return {
                    isDuplicate: true,
                    message: `A user account with mobile phone number '${rawPhone}' already exists (${existingUserPhone.email}). Duplicate mobile numbers are strictly prohibited.`,
                };
            }
            // Check Invitation table for phone
            const existingInvitePhone = await prismaClient.invitation.findFirst({
                where: {
                    phone: { contains: last10Digits },
                    status: { in: ['PENDING', 'INVITATION_SENT'] },
                },
            });
            if (existingInvitePhone) {
                return {
                    isDuplicate: true,
                    message: `An active invitation has already been issued to mobile phone number '${rawPhone}'. Duplicate mobile numbers are strictly prohibited.`,
                };
            }
        }
    }
    return { isDuplicate: false };
}
