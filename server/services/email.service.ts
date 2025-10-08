import sgMail from '@sendgrid/mail';
import { logger } from '../logger';

/**
 * Email template types
 */
export interface MagicLinkEmail {
  to: string;
  token: string;
  frontendUrl: string;
}

export interface PasswordResetEmail {
  to: string;
  token: string;
  frontendUrl: string;
}

export interface EmailChangeEmail {
  to: string;
  token: string;
  frontendUrl: string;
}

export interface AccountDeletedEmail {
  to: string;
}

/**
 * Service for sending emails via SendGrid
 */
export class EmailService {
  private fromEmail: string;
  private isEnabled: boolean;

  constructor(apiKey: string | undefined, fromEmail: string = 'monteirojoaoluiz@gmail.com') {
    this.fromEmail = fromEmail;
    this.isEnabled = !!apiKey;

    if (apiKey) {
      sgMail.setApiKey(apiKey);
    } else {
      logger.warn('SENDGRID_API_KEY not set. Email features will be disabled.');
    }
  }

  /**
   * Send magic link authentication email
   */
  async sendMagicLink(data: MagicLinkEmail): Promise<void> {
    if (!this.isEnabled) {
      logger.warn('Email service disabled. Skipping magic link email.');
      return;
    }

    const msg = {
      to: data.to,
      from: this.fromEmail,
      subject: 'Your Stack16 Magic Link',
      html: `
        <h1>Sign in to Stack16</h1>
        <p>Click the link below to sign in to your account:</p>
        <a href="${data.frontendUrl}/api/auth/verify?token=${data.token}">Sign In</a>
        <p>This link expires in 15 minutes.</p>
      `,
    };

    try {
      await sgMail.send(msg);
      logger.info(`Magic link email sent to ${data.to}`);
    } catch (error: any) {
      logger.error('Error sending magic link email:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(data: PasswordResetEmail): Promise<void> {
    if (!this.isEnabled) {
      logger.warn('Email service disabled. Skipping password reset email.');
      return;
    }

    const resetUrl = `${data.frontendUrl}/reset-password?token=${data.token}`;
    const msg = {
      to: data.to,
      from: this.fromEmail,
      subject: 'Reset Your Stack16 Password',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password for your Stack16 account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    try {
      await sgMail.send(msg);
      logger.info(`Password reset email sent to ${data.to}`);
    } catch (error: any) {
      logger.error('Error sending password reset email:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send email change confirmation
   */
  async sendEmailChangeConfirmation(data: EmailChangeEmail): Promise<void> {
    if (!this.isEnabled) {
      logger.warn('Email service disabled. Skipping email change confirmation.');
      return;
    }

    const verifyUrl = `${data.frontendUrl}/verify-email-change?token=${data.token}`;
    const msg = {
      to: data.to,
      from: this.fromEmail,
      subject: 'Confirm Your Email Change - Stack16',
      html: `
        <h1>Confirm Email Address Change</h1>
        <p>You requested to change your email address for Stack16.</p>
        <p>Click the link below to confirm your new email address:</p>
        <a href="${verifyUrl}">Confirm Email Change</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this change, please ignore this email.</p>
      `,
    };

    try {
      await sgMail.send(msg);
      logger.info(`Email change confirmation sent to ${data.to}`);
    } catch (error: any) {
      logger.error('Error sending email change confirmation:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send account deleted confirmation
   */
  async sendAccountDeleted(data: AccountDeletedEmail): Promise<void> {
    if (!this.isEnabled) {
      logger.warn('Email service disabled. Skipping account deleted email.');
      return;
    }

    const msg = {
      to: data.to,
      from: this.fromEmail,
      subject: 'Account Deleted - Stack16',
      html: `
        <h1>Your Stack16 Account Has Been Deleted</h1>
        <p>This is to confirm that your account has been permanently deleted as per your request.</p>
        <p>If this was a mistake, unfortunately we cannot recover deleted accounts.</p>
        <p>Thank you for using Stack16. We wish you the best in your investment journey!</p>
      `,
    };

    try {
      await sgMail.send(msg);
      logger.info(`Account deleted email sent to ${data.to}`);
    } catch (error: any) {
      // Don't throw error for farewell emails
      logger.error('Error sending account deleted email:', error);
    }
  }
}

// Export singleton instance
export const emailService = new EmailService(
  process.env.SENDGRID_API_KEY,
  'monteirojoaoluiz@gmail.com'
);

