import { body, validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';
import { authConfig } from '../config/auth.config';

/**
 * Validation middleware handler
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }
  next();
};

/**
 * Registration validation rules
 */
export const registerValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: authConfig.passwordRequirements.minLength, max: authConfig.passwordRequirements.maxLength })
    .withMessage(`Password must be between ${authConfig.passwordRequirements.minLength} and ${authConfig.passwordRequirements.maxLength} characters`)
    .matches(authConfig.passwordRequirements.pattern)
    .withMessage(authConfig.passwordRequirements.message),
  handleValidationErrors,
];

/**
 * Login validation rules
 */
export const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

/**
 * Email validation rules
 */
export const emailValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  handleValidationErrors,
];

/**
 * Change email validation rules
 */
export const changeEmailValidation = [
  body('newEmail')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  handleValidationErrors,
];

/**
 * Reset password validation rules
 */
export const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: authConfig.passwordRequirements.minLength, max: authConfig.passwordRequirements.maxLength })
    .withMessage(`Password must be between ${authConfig.passwordRequirements.minLength} and ${authConfig.passwordRequirements.maxLength} characters`)
    .matches(authConfig.passwordRequirements.pattern)
    .withMessage(authConfig.passwordRequirements.message),
  handleValidationErrors,
];

/**
 * Change password validation rules
 */
export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: authConfig.passwordRequirements.minLength, max: authConfig.passwordRequirements.maxLength })
    .withMessage(`New password must be between ${authConfig.passwordRequirements.minLength} and ${authConfig.passwordRequirements.maxLength} characters`)
    .matches(authConfig.passwordRequirements.pattern)
    .withMessage(authConfig.passwordRequirements.message),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  handleValidationErrors,
];

/**
 * Delete account validation rules
 */
export const deleteAccountValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  handleValidationErrors,
];

