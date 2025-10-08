/**
 * Authentication configuration
 */
export const authConfig = {
  // Session configuration
  session: {
    ttl: 7 * 24 * 60 * 60 * 1000, // 1 week
    tableName: 'sessions',
  },

  // Password hashing
  bcrypt: {
    saltRounds: 12,
  },

  // Token expiration times
  tokenExpiration: {
    magicLink: 15 * 60 * 1000, // 15 minutes
    passwordReset: 60 * 60 * 1000, // 1 hour
    emailChange: 60 * 60 * 1000, // 1 hour
  },

  // Rate limiting
  rateLimits: {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      message: 'Too many login attempts. Please try again after 15 minutes.',
    },
    registration: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 attempts per hour
      message: 'Too many registration attempts. Please try again after an hour.',
    },
    magicLink: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // 5 requests per hour
      message: 'Too many magic link requests. Please try again after an hour.',
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 requests per hour
      message: 'Too many password reset requests. Please try again after an hour.',
    },
    emailChange: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 requests per hour
      message: 'Too many email change requests. Please try again after an hour.',
    },
  },

  // Password requirements
  passwordRequirements: {
    minLength: 8,
    maxLength: 128,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
  },
};

/**
 * Get password pepper from environment
 */
export function getPasswordPepper(): string {
  return process.env.PASSWORD_PEPPER || 'default-pepper-change-in-production';
}

/**
 * Get session secret from environment
 */
export function getSessionSecret(): string {
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is required');
  }
  return process.env.SESSION_SECRET;
}

/**
 * Get frontend URL from environment
 */
export function getFrontendUrl(): string {
  return process.env.FRONTEND_URL || 'http://localhost:5000';
}

