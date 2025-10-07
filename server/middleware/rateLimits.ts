import rateLimit from "express-rate-limit";

// Rate limiters for authentication endpoints
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { message: "Too many login attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per hour
  message: { message: "Too many registration attempts. Please try again after an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const magicLinkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 magic link requests per hour
  message: { message: "Too many magic link requests. Please try again after an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  message: { message: "Too many password reset requests. Please try again after an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const emailChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 email change requests per hour
  message: { message: "Too many email change requests. Please try again after an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

