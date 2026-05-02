import { z } from "zod";

// Email validation: RFC 5322 simplified
const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email format")
  .toLowerCase()
  .trim();

// Strong password: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[!@#$%^&*]/, "Password must contain at least one special character (!@#$%^&*)");

// Name: 2-50 chars, letters/spaces/hyphens only
const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must not exceed 50 characters")
  .regex(/^[a-zA-Z\s\-']+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
  .trim();

/**
 * Register Schema
 * BEFORE: Manual validation in controller with basic checks
 * AFTER: Comprehensive validation with sanitization
 */
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Login Schema
 * BEFORE: No validation, possible empty strings or malformed email
 * AFTER: Strict email and password presence check
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

/**
 * Verify OTP Schema
 * BEFORE: No length validation on OTP
 * AFTER: Enforce 6-digit OTP + token presence
 */
export const verifySchema = z.object({
  otp: z
    .coerce.string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
  activationToken: z.string().min(1, "Activation token is required"),
});

/**
 * Update Role Schema (Admin)
 * BEFORE: No validation, could update to invalid roles
 * AFTER: Enum validation for role field
 */
export const updateRoleSchema = z.object({
  role: z.enum(["user", "admin"], {
    errorMap: () => ({ message: "Role must be 'user' or 'admin'" }),
  }),
});
