import rateLimit from 'express-rate-limit';
import { authConfig } from '../config/auth.config';

/**
 * Rate limiter for login attempts
 */
export const loginLimiter = rateLimit({
  windowMs: authConfig.rateLimits.login.windowMs,
  max: authConfig.rateLimits.login.max,
  message: { message: authConfig.rateLimits.login.message },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for registration attempts
 */
export const registrationLimiter = rateLimit({
  windowMs: authConfig.rateLimits.registration.windowMs,
  max: authConfig.rateLimits.registration.max,
  message: { message: authConfig.rateLimits.registration.message },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for magic link requests
 */
export const magicLinkLimiter = rateLimit({
  windowMs: authConfig.rateLimits.magicLink.windowMs,
  max: authConfig.rateLimits.magicLink.max,
  message: { message: authConfig.rateLimits.magicLink.message },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for password reset requests
 */
export const passwordResetLimiter = rateLimit({
  windowMs: authConfig.rateLimits.passwordReset.windowMs,
  max: authConfig.rateLimits.passwordReset.max,
  message: { message: authConfig.rateLimits.passwordReset.message },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for email change requests
 */
export const emailChangeLimiter = rateLimit({
  windowMs: authConfig.rateLimits.emailChange.windowMs,
  max: authConfig.rateLimits.emailChange.max,
  message: { message: authConfig.rateLimits.emailChange.message },
  standardHeaders: true,
  legacyHeaders: false,
});

