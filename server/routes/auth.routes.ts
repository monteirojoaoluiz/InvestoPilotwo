import { Router, type Request, Response, NextFunction } from 'express';
import passport from 'passport';
import crypto from 'crypto';
import { userRepository } from '../repositories';
import { emailService } from '../services';
import { authConfig, getFrontendUrl } from '../config/auth.config';
import {
  isAuthenticated,
  hashPassword,
  verifyPassword,
} from '../middleware/auth.middleware';
import {
  registerValidation,
  loginValidation,
  emailValidation,
  changeEmailValidation,
  resetPasswordValidation,
  changePasswordValidation,
  deleteAccountValidation,
} from '../middleware/validation.middleware';
import {
  loginLimiter,
  registrationLimiter,
  magicLinkLimiter,
  passwordResetLimiter,
  emailChangeLimiter,
} from '../middleware/rate-limit.middleware';
import { logger } from '../logger';
import { authTokens, type InsertAuthTokenInput } from '@shared/schema';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */
router.post('/register', registrationLimiter, registerValidation, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await userRepository.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await userRepository.createUser({
      email,
      password: hashedPassword,
      firstName: '',
      lastName: '',
      profileImageUrl: ''
    });

    // Auto-login after registration
    req.login(user, async (err: any) => {
      if (err) {
        logger.error('Auto-login error:', err);
        return res.status(500).json({ message: 'Registration successful, but login failed' });
      }
      try {
        await userRepository.updateUserLastLogin((user as any).id);
      } catch (updateErr) {
        logger.error('Failed to update last login on register:', updateErr);
      }
      res.json({ 
        message: 'Registration successful', 
        user: { id: (user as any).id, email: (user as any).email } 
      });
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', loginLimiter, loginValidation, (req: Request, res: Response, next: NextFunction) => {
  logger.info('Login attempt for:', req.body.email);
  
  passport.authenticate('local', async (err: any, user: any, info: any) => {
    if (err) {
      logger.error('Login error:', err);
      return res.status(500).json({ message: 'Login failed' });
    }

    if (!user) {
      logger.info('Login failed - invalid credentials for:', req.body.email);
      return res.status(401).json({ message: info?.message || 'Invalid credentials' });
    }

    logger.info('Login successful for user:', (user as any).email);
    
    req.login(user, async (err: any) => {
      if (err) {
        logger.error('Session login error:', err);
        return res.status(500).json({ message: 'Login failed' });
      }

      logger.info('Session created for user:', (user as any).email);
      try {
        await userRepository.updateUserLastLogin((user as any).id);
      } catch (updateErr) {
        logger.error('Failed to update last login on login:', updateErr);
      }
      
      res.json({ 
        message: 'Login successful', 
        user: { id: (user as any).id, email: (user as any).email } 
      });
    });
  })(req, res, next);
});

/**
 * POST /api/auth/logout
 * Logout current user
 */
router.post('/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

/**
 * GET /api/auth/user
 * Get current authenticated user
 */
router.get('/user', isAuthenticated, async (req: Request, res: Response) => {
  try {
    logger.info('User auth check - user:', (req.user as any)?.email);
    res.json(req.user);
  } catch (error) {
    logger.error('User fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', passwordResetLimiter, emailValidation, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await userRepository.getUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate secure reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + authConfig.tokenExpiration.passwordReset);

    // Store reset token
    await userRepository.createPasswordResetToken({
      userId: (user as any).id,
      token,
      expiresAt,
      used: false,
    });

    // Send reset email
    await emailService.sendPasswordReset({
      to: email,
      token,
      frontendUrl: getFrontendUrl(),
    });

    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    logger.error('Password reset request error:', error);
    res.status(500).json({ message: 'Failed to process password reset request' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', resetPasswordValidation, async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    // Get and validate reset token
    const resetToken = await userRepository.getPasswordResetToken(token);
    if (!resetToken || resetToken.used || new Date() > resetToken.expiresAt) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password
    await userRepository.updateUserPassword(resetToken.userId, hashedPassword);

    // Mark token as used
    await userRepository.markPasswordResetTokenAsUsed(resetToken.id);

    res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
  } catch (error) {
    logger.error('Password reset error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 */
router.post('/change-password', isAuthenticated, changePasswordValidation, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    if (!(user as any).password) {
      return res.status(400).json({ message: 'This account does not have a password set. Use password reset to set one.' });
    }

    // Verify current password
    const isValidCurrent = await verifyPassword(currentPassword, (user as any).password);
    if (!isValidCurrent) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNew = await hashPassword(newPassword);

    // Update password
    await userRepository.updateUserPassword((user as any).id, hashedNew);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

/**
 * POST /api/auth/change-email
 * Request email change
 */
router.post('/change-email', isAuthenticated, emailChangeLimiter, changeEmailValidation, async (req: Request, res: Response) => {
  try {
    const { newEmail } = req.body;
    const user = req.user;

    if (newEmail === (user as any).email) {
      return res.status(400).json({ message: 'New email cannot be the same as current email' });
    }

    // Check if new email already exists
    const existingUser = await userRepository.getUserByEmail(newEmail);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use by another account' });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + authConfig.tokenExpiration.emailChange);

    // Store token
    await userRepository.createEmailChangeToken({
      userId: (user as any).id,
      pendingEmail: newEmail,
      token,
      expiresAt,
      used: false,
    });

    // Send confirmation email
    await emailService.sendEmailChangeConfirmation({
      to: newEmail,
      token,
      frontendUrl: getFrontendUrl(),
    });

    res.json({ message: 'Verification email sent to new address. Please check your email to confirm the change.' });
  } catch (error) {
    logger.error('Email change request error:', error);
    res.status(500).json({ message: 'Failed to process email change request' });
  }
});

/**
 * GET /api/auth/verify-email-change
 * Verify email change token
 */
router.get('/verify-email-change', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).redirect('/account?error=no_token');
    }

    const emailToken = await userRepository.getEmailChangeTokenByToken(token as string);
    if (!emailToken || emailToken.used || new Date() > emailToken.expiresAt) {
      return res.status(400).redirect('/account?error=invalid_token');
    }

    // Update user email
    await userRepository.updateUserEmail(emailToken.userId, emailToken.pendingEmail);

    // Mark token as used
    await userRepository.markEmailChangeTokenAsUsed(emailToken.id);

    res.redirect('/account?success=email_changed');
  } catch (error) {
    logger.error('Email change verification error:', error);
    res.status(500).redirect('/account?error=server_error');
  }
});

/**
 * POST /api/auth/delete-account
 * Delete user account (GDPR right to be forgotten)
 */
router.post('/delete-account', isAuthenticated, deleteAccountValidation, async (req: Request, res: Response) => {
  try {
    const { currentPassword } = req.body;
    const user = req.user;

    if (!(user as any).password) {
      return res.status(400).json({ message: 'Cannot delete account without password verification. Please set a password first.' });
    }

    // Verify current password
    const isValidCurrent = await verifyPassword(currentPassword, (user as any).password);
    if (!isValidCurrent) {
      return res.status(400).json({ message: 'Password incorrect' });
    }

    // Send farewell email (non-blocking)
    emailService.sendAccountDeleted({
      to: (user as any).email,
    }).catch(err => logger.error('Failed to send farewell email:', err));

    // Delete user data
    await userRepository.deleteUserData((user as any).id);

    // Logout
    req.logout((err) => {
      if (err) logger.error('Logout error on delete:', err);
    });

    res.json({ message: 'Account deleted successfully. All data has been removed.' });
  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

/**
 * GET /api/auth/download-data
 * Download user data (GDPR data portability)
 */
router.get('/download-data', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user;

    // Collect all user data
    const userData = {
      user: {
        id: (user as any).id,
        email: (user as any).email,
        firstName: (user as any).firstName,
        lastName: (user as any).lastName,
        profileImageUrl: (user as any).profileImageUrl,
        createdAt: (user as any).createdAt,
        updatedAt: (user as any).updatedAt,
        lastLogin: (user as any).lastLogin,
      },
      riskAssessments: await (await import('../repositories')).assessmentRepository.getRiskAssessmentsByUserId((user as any).id),
      portfolioRecommendations: await (await import('../repositories')).portfolioRepository.getPortfolioRecommendationsByUserId((user as any).id),
      portfolioMessages: await (await import('../repositories')).messageRepository.getPortfolioMessagesByUserId((user as any).id),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    // Set headers for file download
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `stack16-data-${(user as any).email}-${timestamp}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.json(userData);
  } catch (error) {
    logger.error('Download data error:', error);
    res.status(500).json({ message: 'Failed to download data' });
  }
});

export default router;

