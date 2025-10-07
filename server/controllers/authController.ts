import { Request, Response } from 'express';
import { resolve } from '../di/container';
import crypto from 'crypto';
import sgMail from '@sendgrid/mail';
import bcrypt from 'bcrypt';
import { config } from '../config';

// Ensure SendGrid configured if available
if (config.SENDGRID_API_KEY) {
  sgMail.setApiKey(config.SENDGRID_API_KEY);
}

const saltRounds = 12;
const PEPPER = process.env.PASSWORD_PEPPER || 'default-pepper-change-in-production';

export async function sendMagicLink(req: Request, res: Response) {
  try {
    const storage = resolve<any>('Storage');
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    let user = await storage.getUserByEmail(email);
    if (!user) {
      user = await storage.createUser({ email, firstName: '', lastName: '', profileImageUrl: '' });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await storage.createAuthToken({ email, token, expiresAt });

    const msg = {
      to: email,
      from: 'monteirojoaoluiz@gmail.com',
      subject: 'Your Stack16 Magic Link',
      html: `
        <h1>Sign in to Stack16</h1>
        <p>Click the link below to sign in to your account:</p>
        <a href="${process.env.FRONTEND_URL}/api/auth/verify?token=${token}">Sign In</a>
        <p>This link expires in 15 minutes.</p>
      `,
    };

    if (config.SENDGRID_API_KEY) {
      await sgMail.send(msg);
    } else {
      console.warn('SENDGRID_API_KEY not set - skipping email send');
    }

    res.json({ message: 'Magic link sent to your email' });
  } catch (error) {
    console.error('Error sending magic link:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
}

export async function verifyMagicLink(req: Request, res: Response) {
  try {
    const storage = resolve<any>('Storage');
    const { token } = req.query;
    if (!token) return res.status(400).redirect('/?error=no_token');

    const authToken = await storage.getAuthTokenByToken(token as string);
    if (!authToken || authToken.used || new Date() > authToken.expiresAt) {
      return res.status(400).redirect('/?error=invalid_token');
    }

    let user = await storage.getUserByEmail(authToken.email);
    if (!user) {
      user = await storage.createUser({ email: authToken.email, firstName: '', lastName: '', profileImageUrl: '' });
    }

    await storage.markTokenAsUsed(authToken.id);

    req.login(user, async (err: any) => {
      if (err) return res.status(500).redirect('/?error=login_failed');
      try {
        await storage.updateUserLastLogin((user as any).id);
      } catch (e) {
        console.error('Failed to update last login on magic link:', e);
      }
      res.redirect('/dashboard');
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).redirect('/?error=server_error');
  }
}

export async function getUser(req: Request, res: Response) {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
}

export async function logout(req: Request, res: Response) {
  req.logout((err: any) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const storage = resolve<any>('Storage');
    const { email } = req.body;
    const user = await storage.getUserByEmail(email);
    if (!user) return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await storage.createPasswordResetToken({ userId: (user as any).id, token, expiresAt, used: false });

    const resetUrl = `${config.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
    const msg = {
      to: email,
      from: 'monteirojoaoluiz@gmail.com',
      subject: 'Reset Your Stack16 Password',
      html: `
        <h1>Password Reset Request</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `,
    };

    if (config.SENDGRID_API_KEY) await sgMail.send(msg);
    else console.warn('SENDGRID_API_KEY not set - skipping email send');

    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Failed to process password reset request' });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const storage = resolve<any>('Storage');
    const { token, password } = req.body;
    const resetToken = await storage.getPasswordResetToken(token);
    if (!resetToken || resetToken.used || new Date() > resetToken.expiresAt) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const pepperedPassword = password + PEPPER;
    const hashedPassword = await bcrypt.hash(pepperedPassword, saltRounds);

    await storage.updateUserPassword(resetToken.userId, hashedPassword);
    await storage.markPasswordResetTokenAsUsed(resetToken.id);

    res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
}
