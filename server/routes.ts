// Reference: javascript_log_in_with_replit integration
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRiskAssessmentSchema, insertPortfolioMessageSchema } from "@shared/schema";
import { z } from "zod";
import { isAuthenticated } from "./middleware/auth";
import {
  loginLimiter,
  registrationLimiter,
  magicLinkLimiter,
  passwordResetLimiter,
  emailChangeLimiter,
} from "./middleware/rateLimits";
import {
  registerValidation,
  loginValidation,
  emailValidation,
  changeEmailValidation,
  resetPasswordValidation,
  changePasswordValidation,
  deleteAccountValidation,
} from "./middleware/authValidation";

import crypto from 'crypto';
import sgMail from '@sendgrid/mail';
import { authTokens, insertAuthTokenSchema } from "@shared/schema";
import type { AuthToken, InsertAuthTokenInput } from "@shared/schema";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import connectPg from "connect-pg-simple";
import bcrypt from 'bcrypt';
import { pool } from "./db";
import { Groq } from 'groq-sdk';
import yahooFinance from 'yahoo-finance2';
import { config } from "./config";
import { registerDefaultBindings } from './di/container';
import * as portfolioController from './controllers/portfolioController';
import * as authController from './controllers/authController';
import * as etfController from './controllers/etfController';
import * as chatController from './controllers/chatController';

const groqClient = new Groq({
  apiKey: config.GROQ_API_KEY!,
});

// Simple in-memory cache for Yahoo Finance data
const yahooCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedYahooData(ticker: string, period1: Date, period2: Date, interval: string) {
  const cacheKey = `${ticker}-${period1.getTime()}-${period2.getTime()}-${interval}`;
  const cached = yahooCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`Using cached data for ${ticker}`);
    return cached.data;
  }
  
  return null;
}

function setCachedYahooData(ticker: string, period1: Date, period2: Date, interval: string, data: any) {
  const cacheKey = `${ticker}-${period1.getTime()}-${period2.getTime()}-${interval}`;
  yahooCache.set(cacheKey, { data, timestamp: Date.now() });
}

// Setup session (moved from replitAuth)
const getSession = () => {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    pool: pool, // Use our existing pool
    createTableIfMissing: true, // Create sessions table if it doesn't exist
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      maxAge: sessionTtl,
      sameSite: 'lax', // Allow cross-site requests
    },
  });
};

// Local strategy for email/password authentication
passport.use(new LocalStrategy(
  { usernameField: 'email', passwordField: 'password' },
  async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      // Check if user has a password (new users) or is legacy user without password
      if (!(user as any).password) {
        return done(null, false, { message: 'This account was created with magic link. Please use the magic link to sign in or reset your password.' });
      }

      // Check password with pepper
      const pepperedPassword = password + PEPPER;
      const isValidPassword = await bcrypt.compare(pepperedPassword, (user as any).password);
      if (!isValidPassword) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

passport.serializeUser((user: any, done) => {
  done(null, (user as any).id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Middleware and validation rules imported from separate files above

// Setup SendGrid if available
if (config.SENDGRID_API_KEY) {
  sgMail.setApiKey(config.SENDGRID_API_KEY);
}

// Password hashing utilities
const saltRounds = 12;
const PEPPER = process.env.PASSWORD_PEPPER || 'default-pepper-change-in-production';

export async function registerRoutes(app: Express): Promise<Server> {
  // Env validation occurs in server/config.ts on import
  console.log('Environment configuration validated');

  // Register DI bindings
  try {
    registerDefaultBindings();
  } catch (err) {
    console.warn('DI bindings registration failed (this is non-fatal):', err);
  }

  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Use portfolio controller for portfolio endpoints (incremental migration)
  app.post('/api/portfolio/generate', isAuthenticated, portfolioController.generatePortfolio);
  app.get('/api/portfolio', isAuthenticated, portfolioController.getPortfolio);

  // Keep remaining routes in this file for now (will be migrated to controllers)

  // Password-based auth routes
  app.post('/api/auth/register', registrationLimiter, registerValidation, async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Hash password with pepper
      const pepperedPassword = password + PEPPER;
      const hashedPassword = await bcrypt.hash(pepperedPassword, saltRounds);

      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName: '',
        lastName: '',
        profileImageUrl: ''
      });

      // Auto-login after registration
      req.login(user, async (err: any) => {
        if (err) {
          console.error('Auto-login error:', err);
          return res.status(500).json({ message: 'Registration successful, but login failed' });
        }
        try {
          await storage.updateUserLastLogin((user as any).id);
        } catch (updateErr) {
          console.error('Failed to update last login on register:', updateErr);
        }
        res.json({ message: 'Registration successful', user: { id: (user as any).id, email: (user as any).email } });
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', loginLimiter, loginValidation, (req: Request, res: Response, next: NextFunction) => {
    console.log('Login attempt for:', req.body.email);
    passport.authenticate('local', async (err: any, user: any, info: any) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Login failed' });
      }

      if (!user) {
        console.log('Login failed - invalid credentials for:', req.body.email);
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }

      console.log('Login successful for user:', (user as any).email);
      req.login(user, async (err: any) => {
        if (err) {
          console.error('Session login error:', err);
          return res.status(500).json({ message: 'Login failed' });
        }

        console.log('Session created for user:', (user as any).email);
        try {
          await storage.updateUserLastLogin((user as any).id);
        } catch (updateErr) {
          console.error('Failed to update last login on login:', updateErr);
        }
        res.json({ message: 'Login successful', user: { id: (user as any).id, email: (user as any).email } });
      });
    })(req, res, next);
  });

  // Auth routes (migrated handlers)
  app.post('/api/auth/send', magicLinkLimiter, emailValidation, authController.sendMagicLink);
  app.get('/api/auth/verify', authController.verifyMagicLink);
  app.get('/api/auth/user', isAuthenticated, authController.getUser);
  app.post('/api/auth/logout', authController.logout);
  app.post('/api/auth/forgot-password', passwordResetLimiter, emailValidation, authController.forgotPassword);
  app.post('/api/auth/reset-password', resetPasswordValidation, authController.resetPassword);

  // ETF routes
  app.get('/api/etf/:ticker/history', isAuthenticated, etfController.getHistory);
  app.get('/api/etf/:ticker/info', isAuthenticated, etfController.getInfo);

  // Portfolio chat routes
  app.get('/api/portfolio/:portfolioId/messages', isAuthenticated, chatController.getMessages);
  app.delete('/api/portfolio/:portfolioId/messages', isAuthenticated, chatController.deleteMessages);
  app.post('/api/portfolio/:portfolioId/messages', isAuthenticated, chatController.postMessage);

  // Add change password route after password reset routes
  app.post('/api/auth/change-password', isAuthenticated, changePasswordValidation, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user;

      if (!(user as any).password) {
        return res.status(400).json({ message: 'This account does not have a password set. Use password reset to set one.' });
      }

      // Verify current password
      const pepperedCurrent = currentPassword + PEPPER;
      const isValidCurrent = await bcrypt.compare(pepperedCurrent, (user as any).password);
      if (!isValidCurrent) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Hash new password
      const pepperedNew = newPassword + PEPPER;
      const hashedNew = await bcrypt.hash(pepperedNew, saltRounds);

      // Update password
      await storage.updateUserPassword((user as any).id, hashedNew);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Failed to change password' });
    }
  });

  app.post('/api/auth/change-email', isAuthenticated, emailChangeLimiter, changeEmailValidation, async (req: Request, res: Response) => {
    try {
      const { newEmail } = req.body;
      const user = req.user;

      if (newEmail === (user as any).email) {
        return res.status(400).json({ message: 'New email cannot be the same as current email' });
      }

      // Check if new email already exists
      const existingUser = await storage.getUserByEmail(newEmail);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use by another account' });
      }

      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store token
      const tokenData = {
        userId: (user as any).id,
        pendingEmail: newEmail,
        token,
        expiresAt,
        used: false,
      };

      await storage.createEmailChangeToken(tokenData);

      // Send confirmation email to new address
      const verifyUrl = `${config.FRONTEND_URL || 'http://localhost:5000'}/verify-email-change?token=${token}`;
      const msg = {
        to: newEmail,
        from: 'monteirojoaoluiz@gmail.com',
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

      await sgMail.send(msg);

      res.json({ message: 'Verification email sent to new address. Please check your email to confirm the change.' });
    } catch (error) {
      console.error('Email change request error:', error);
      res.status(500).json({ message: 'Failed to process email change request' });
    }
  });

  app.post('/api/auth/delete-account', isAuthenticated, deleteAccountValidation, async (req: Request, res: Response) => {
    try {
      const { currentPassword } = req.body;
      const user = req.user;

      if (!(user as any).password) {
        return res.status(400).json({ message: 'Cannot delete account without password verification. Please set a password first.' });
      }

      // Verify current password
      const pepperedCurrent = currentPassword + PEPPER;
      const isValidCurrent = await bcrypt.compare(pepperedCurrent, (user as any).password);
      if (!isValidCurrent) {
        return res.status(400).json({ message: 'Password incorrect' });
      }

      // Send farewell email
      const farewellMsg = {
        to: (user as any).email,
        from: 'monteirojoaoluiz@gmail.com',
        subject: 'Account Deleted - Stack16',
        html: `
          <h1>Your Stack16 Account Has Been Deleted</h1>
          <p>This is to confirm that your account has been permanently deleted as per your request.</p>
          <p>If this was a mistake, unfortunately we cannot recover deleted accounts.</p>
          <p>Thank you for using Stack16. We wish you the best in your investment journey!</p>
        `,
      };

      if (config.SENDGRID_API_KEY) {
        await sgMail.send(farewellMsg).catch(console.error); // non-blocking
      }

      // Delete user data
      await storage.deleteUserData((user as any).id);

      // Logout
      req.logout((err) => {
        if (err) console.error('Logout error on delete:', err);
      });

      res.json({ message: 'Account deleted successfully. All data has been removed.' });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({ message: 'Failed to delete account' });
    }
  });

  app.get('/api/auth/download-data', isAuthenticated, async (req: Request, res: Response) => {
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
        riskAssessments: await storage.getRiskAssessmentsByUserId((user as any).id),
        portfolioRecommendations: await storage.getPortfolioRecommendationsByUserId((user as any).id),
        portfolioMessages: await storage.getPortfolioMessagesByUserId((user as any).id),
        exportedAt: new Date().toISOString(),
        version: '1.0',
      };

      // Create filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `stack16-data-${(user as any).email}-${timestamp}.json`;

      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      res.json(userData);
    } catch (error) {
      console.error('Download data error:', error);
      res.status(500).json({ message: 'Failed to download data' });
    }
  });

  app.get('/api/auth/verify-email-change', async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).redirect('/account?error=no_token');
      }

      const emailToken = await storage.getEmailChangeTokenByToken(token as string);
      if (!emailToken || emailToken.used || new Date() > emailToken.expiresAt) {
        return res.status(400).redirect('/account?error=invalid_token');
      }

      // Update user email
      await storage.updateUserEmail(emailToken.userId, emailToken.pendingEmail);

      // Mark token as used
      await storage.markEmailChangeTokenAsUsed(emailToken.id);

      res.redirect('/account?success=email_changed');
    } catch (error) {
      console.error('Email change verification error:', error);
      res.status(500).redirect('/account?error=server_error');
    }
  });

  // Debug endpoint
  app.get('/api/debug', (req, res) => {
    res.json({
      environment: process.env.NODE_ENV,
      hasSessionSecret: !!process.env.SESSION_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasPasswordPepper: !!process.env.PASSWORD_PEPPER,
      sessionId: req.sessionID,
      isAuthenticated: req.isAuthenticated(),
      user: req.user ? { id: (req.user as any).id, email: (req.user as any).email } : null,
    });
  });

  // Cleanup expired tokens (wrapped for safety)
  try {
    await storage.deleteExpiredTokens();
  } catch (err) {
    console.warn('Failed to cleanup expired auth tokens:', err);
  }
  try {
    await storage.deleteExpiredPasswordResetTokens();
  } catch (err) {
    console.warn('Failed to cleanup expired password reset tokens:', err);
  }
  try {
    await storage.deleteExpiredEmailChangeTokens();
  } catch (err) {
    console.warn('Failed to cleanup expired email change tokens (table may not exist yet):', err);
  }
  try {
    await storage.hardDeleteOldUsers();
  } catch (err) {
    console.warn('Failed to hard delete old users (feature may not be enabled yet):', err);
  }

  // Risk assessment routes
  app.post('/api/risk-assessment', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const validatedData = insertRiskAssessmentSchema.parse(req.body);
      
      // Ensure esgExclusions is an array (default to empty array if undefined)
      const assessmentData = {
        ...validatedData,
        userId,
        esgExclusions: validatedData.esgExclusions || [],
      };
      
      console.log('Creating risk assessment with data:', assessmentData);
      const assessment = await storage.createRiskAssessment(assessmentData);
      
      res.json(assessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating risk assessment:", error);
      res.status(500).json({ message: "Failed to create risk assessment" });
    }
  });

  app.get('/api/risk-assessment', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const assessment = await storage.getRiskAssessmentByUserId(userId);
      res.json(assessment);
    } catch (error) {
      console.error("Error fetching risk assessment:", error);
      res.status(500).json({ message: "Failed to fetch risk assessment" });
    }
  });

  // Portfolio routes
  app.post('/api/portfolio/generate', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const assessment = await storage.getRiskAssessmentByUserId(userId);
      
      if (!assessment) {
        return res.status(400).json({ message: "Please complete risk assessment first" });
      }

      const allocations = generateEtfAllocationsFromAssessment(assessment);
      
      const portfolio = await storage.createPortfolioRecommendation({
        userId,
        riskAssessmentId: assessment.id,
        allocations,  // Pass object directly for jsonb
        totalValue: 0,
        totalReturn: 0,
      });
      
      res.json(portfolio);
    } catch (error) {
      console.error("Error generating portfolio:", error);
      res.status(500).json({ message: "Failed to generate portfolio" });
    }
  });

  app.get('/api/portfolio', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      console.log('Fetching portfolio for userId:', userId);
      const portfolio = await storage.getPortfolioByUserId(userId);

      if (!portfolio) {
        console.log('No portfolio found for user:', userId, '- returning default portfolio');

        // Return default conservative portfolio when no user portfolio exists
        const defaultPortfolio = {
          id: null,
          totalValue: 0,
          totalReturn: 0,
          allocations: [
            { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', percentage: 60, color: 'hsl(var(--chart-3))', assetType: 'Bonds' },
            { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', percentage: 25, color: 'hsl(var(--chart-1))', assetType: 'US Equity' },
            { ticker: 'VXUS', name: 'Vanguard Total International Stock ETF', percentage: 10, color: 'hsl(var(--chart-2))', assetType: 'International Equity' },
            { ticker: 'VNQ', name: 'Vanguard Real Estate ETF', percentage: 5, color: 'hsl(var(--chart-4))', assetType: 'REIT' },
          ]
        };

        return res.json(defaultPortfolio);
      }

      const response = {
        ...portfolio,
        allocations: portfolio.allocations,  // Already parsed object from jsonb
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching portfolio for user:", (req.user as any)?.id || 'unknown', "Full error:", error);
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  // Combined portfolio performance (3y daily, normalized to 100)
  app.get('/api/portfolio/performance', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const portfolio = await storage.getPortfolioByUserId(userId);

      // Default conservative portfolio if no user portfolio exists
      const defaultAllocations = [
        { ticker: 'BND', percentage: 60, name: 'Vanguard Total Bond Market ETF', color: 'hsl(var(--chart-3))', assetType: 'Bonds' },
        { ticker: 'VTI', percentage: 25, name: 'Vanguard Total Stock Market ETF', color: 'hsl(var(--chart-1))', assetType: 'US Equity' },
        { ticker: 'VXUS', percentage: 10, name: 'Vanguard Total International Stock ETF', color: 'hsl(var(--chart-2))', assetType: 'International Equity' },
        { ticker: 'VNQ', percentage: 5, name: 'Vanguard Real Estate ETF', color: 'hsl(var(--chart-4))', assetType: 'REIT' },
      ];

      const allocations = portfolio ? (portfolio as any).allocations || [] : defaultAllocations;

      let tickers = allocations
        .filter((a: any) => a && typeof a.percentage === 'number' && (a.percentage as number) > 0 && typeof a.ticker === 'string')
        .map((a: any) => ({ ticker: (a.ticker as string).toUpperCase(), weight: (a.percentage as number) / 100 }));

      // Normalize weights to sum to 1
      const totalWeight = tickers.reduce((sum: number, t: any) => sum + t.weight, 0);
      if (totalWeight > 0) {
        tickers = tickers.map((t: any) => ({ ...t, weight: t.weight / totalWeight }));
      }

      if (tickers.length === 0) {
        return res.json({ points: [] });
      }

      // Sort by weight (highest first) to prioritize most important tickers
      tickers.sort((a: any, b: any) => b.weight - a.weight);
      
      // Limit to top 3 tickers to reduce rate limiting issues
      if (tickers.length > 3) {
        console.log(`Limiting to top 3 tickers by weight to avoid rate limiting: ${tickers.slice(0, 3).map((t: any) => t.ticker).join(', ')}`);
        tickers = tickers.slice(0, 3);
        
        // Renormalize weights
        const newTotalWeight = tickers.reduce((sum: number, t: any) => sum + t.weight, 0);
        if (newTotalWeight > 0) {
          tickers = tickers.map((t: any) => ({ ...t, weight: t.weight / newTotalWeight }));
        }
      }

      // Yahoo requires UTC dates; set to midnight UTC for stability
      const now = new Date();
      const period2 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const threeYearsAgo = new Date(period2);
      threeYearsAgo.setUTCFullYear(threeYearsAgo.getUTCFullYear() - 3);
      const period1 = threeYearsAgo;

      // Sequential requests with delays to avoid rate limiting
      const charts = [];
      for (let i = 0; i < tickers.length; i++) {
        const t = tickers[i];
        
        try {
          // Check cache first
          const cachedData = await getCachedYahooData(t.ticker, period1, period2, '1d');
          let chart: any;
          
          if (cachedData) {
            chart = cachedData;
          } else {
            // Add delay between requests to avoid rate limiting
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
            }

            console.log(`Fetching data for ${t.ticker} (${i + 1}/${tickers.length})`);
            chart = await yahooFinance.chart(t.ticker, { period1, period2, interval: '1d' } as any);
            
            // Cache the successful result
            setCachedYahooData(t.ticker, period1, period2, '1d', chart);
          }

          let points: Array<{ date: string; price: number }> = [];

          // Case 1: quotes array with Date objects
          if (Array.isArray(chart?.quotes) && chart.quotes.length > 0 && chart.quotes[0]?.date) {
            points = chart.quotes
              .map((q: any) => ({
                date: q.date instanceof Date ? q.date.toISOString().slice(0, 10) : q.date,
                price: typeof q.adjclose === 'number' ? q.adjclose : q.close,
              }))
              .filter((p: any) => typeof p.price === 'number');
          } else if (Array.isArray(chart?.timestamp) && chart?.indicators) {
            // Case 2: timestamp + indicators.quote/adjclose arrays
            const ts: number[] = chart.timestamp;
            const quote = Array.isArray(chart.indicators?.quote) ? chart.indicators.quote[0] : undefined;
            const adj = Array.isArray(chart.indicators?.adjclose) ? chart.indicators.adjclose[0] : undefined;

            points = ts.map((tSec: number, i: number) => {
              const close = Array.isArray(quote?.close) ? quote.close[i] : undefined;
              const adjClose = Array.isArray(adj?.adjclose) ? adj.adjclose[i] : undefined;
              const price = typeof adjClose === 'number' ? adjClose : close;
              return {
                date: new Date(tSec * 1000).toISOString().slice(0, 10),
                price,
              };
            }).filter((p: any) => typeof p.price === 'number');
          }

          // Ensure ascending by date
          points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

          console.log(`Successfully fetched ${points.length} data points for ${t.ticker}`);
          charts.push({ ticker: t.ticker, weight: t.weight, points });
        } catch (error: any) {
          console.error(`Error fetching chart data for ${t.ticker}:`, error.message);

          // Handle rate limiting or other Yahoo Finance errors
          if (error.message?.includes('Too Many Requests') ||
              error.message?.includes('429') ||
              error.message?.includes('rate limit') ||
              error.message?.includes('Unexpected token')) {
            console.warn(`Rate limit hit for ${t.ticker}, skipping this ticker`);
            charts.push({ ticker: t.ticker, weight: t.weight, points: [] });
            
            // If we hit rate limit, add extra delay before next request
            if (i < tickers.length - 1) {
              console.log('Adding extra delay due to rate limiting...');
              await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
            }
            continue;
          }

          // For other errors, return empty points
          console.warn(`Failed to fetch data for ${t.ticker}, using empty data`);
          charts.push({ ticker: t.ticker, weight: t.weight, points: [] });
        }
      }

      // Check if we have any valid data
      const chartsWithData = charts.filter(c => c.points.length > 0);
      if (chartsWithData.length === 0) {
        console.warn('No valid chart data available for any tickers - likely due to rate limiting');
        return res.json({
          points: [],
          warning: 'Market data temporarily unavailable due to service limits. Performance chart will update when data becomes available.'
        });
      }

      // If we have some data but not all, log the success rate
      const successRate = (chartsWithData.length / charts.length) * 100;
      console.log(`Successfully fetched data for ${chartsWithData.length}/${charts.length} tickers (${successRate.toFixed(1)}% success rate)`);

      // Determine a common start date where all series have data
      const firstDates = charts.map((c) => c.points[0]?.date).filter(Boolean) as string[];
      const startDate = firstDates.length === charts.length ? firstDates.sort().reverse()[0] : undefined; // latest first date across all

      // Build union of dates and filter to >= startDate
      const union = new Set<string>();
      charts.forEach((c) => c.points.forEach((p) => union.add(p.date)));
      let dates = Array.from(union).filter((d) => !startDate || d >= startDate);
      dates.sort();

      // Build maps and forward-fill prices
      const priceMap: Record<string, Record<string, number>> = {};
      charts.forEach((c) => {
        priceMap[c.ticker] = {};
        c.points.forEach((p) => {
          priceMap[c.ticker][p.date] = p.price;
        });
      });

      const lastPrice: Record<string, number | undefined> = {};
      const points: Array<{ date: string; value: number }> = [];
      let indexValue = 100;

      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];

        if (points.length === 0) {
          // Seed lastPrice where available; start index at 100
          for (const c of charts) {
            const p = priceMap[c.ticker][date];
            if (typeof p === 'number') lastPrice[c.ticker] = p;
          }
          points.push({ date, value: indexValue });
          continue;
        }

        // For each ticker, forward-fill if missing then compute daily ratio
        let portfolioRatio = 0;
        let contributingWeight = 0;
        for (const c of charts) {
          const prev = lastPrice[c.ticker];
          const current = priceMap[c.ticker][date] ?? prev;
          if (typeof prev === 'number' && typeof current === 'number' && prev > 0) {
            const ratio = current / prev;
            portfolioRatio += c.weight * ratio;
            contributingWeight += c.weight;
            lastPrice[c.ticker] = current;
          } else if (typeof current === 'number' && typeof prev !== 'number') {
            // Late-starting ticker: seed without affecting today
            lastPrice[c.ticker] = current;
          }
        }

        if (contributingWeight > 0) {
          const normalizedPortfolioRatio = portfolioRatio / contributingWeight;
          indexValue = indexValue * normalizedPortfolioRatio;
          points.push({ date, value: +indexValue.toFixed(4) });
        }
      }

      res.json({ points });
    } catch (error) {
      console.error('Error computing portfolio performance:', error);
      res.status(500).json({
        message: 'Failed to compute portfolio performance. This may be due to temporary market data service limitations. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Keep the generate functions
function normalizeAllocationsTo100<T extends { percentage: number }>(allocs: T[]): T[] {
  const total = allocs.reduce((sum, a) => sum + (a.percentage || 0), 0);
  if (total === 0) return allocs;
  const scale = 100 / total;
  const withScaled = allocs.map((a) => ({
    item: a,
    raw: (a.percentage || 0) * scale,
  }));
  const floors = withScaled.map(({ item, raw }) => ({ item, floor: Math.floor(raw), rem: raw - Math.floor(raw) }));
  let sumFloors = floors.reduce((s, f) => s + f.floor, 0);
  const needed = 100 - sumFloors;
  // Distribute remainders
  floors.sort((a, b) => b.rem - a.rem);
  for (let i = 0; i < floors.length; i++) {
    if (i < needed) floors[i].floor += 1;
  }
  // Restore original order
  const result = floors
    .sort((a, b) => allocs.indexOf(a.item) - allocs.indexOf(b.item))
    .map(({ item, floor }) => ({ ...item, percentage: floor } as T));
  return result;
}

function generateEtfAllocationsFromAssessment(assessment: any) {
  const { riskTolerance, geographicFocus, esgExclusions, dividendVsGrowth } = assessment;

  // Handle geographicFocus as array or string for backward compatibility
  const geographicFocusArray = Array.isArray(geographicFocus) ? geographicFocus : [geographicFocus];

  // Baseline ETF sets by risk
  const ETF_SETS: Record<string, { ticker: string; name: string; percentage: number; color: string; assetType: string }[]> = {
    conservative: [
      { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', percentage: 60, color: 'hsl(var(--chart-3))', assetType: 'Bonds' },
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', percentage: 25, color: 'hsl(var(--chart-1))', assetType: 'US Equity' },
      { ticker: 'VXUS', name: 'Vanguard Total International Stock ETF', percentage: 10, color: 'hsl(var(--chart-2))', assetType: 'International Equity' },
      { ticker: 'VNQ', name: 'Vanguard Real Estate ETF', percentage: 5, color: 'hsl(var(--chart-4))', assetType: 'REIT' },
    ],
    moderate: [
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', percentage: 55, color: 'hsl(var(--chart-1))', assetType: 'US Equity' },
      { ticker: 'VXUS', name: 'Vanguard Total International Stock ETF', percentage: 20, color: 'hsl(var(--chart-2))', assetType: 'International Equity' },
      { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', percentage: 20, color: 'hsl(var(--chart-3))', assetType: 'Bonds' },
      { ticker: 'VNQ', name: 'Vanguard Real Estate ETF', percentage: 5, color: 'hsl(var(--chart-4))', assetType: 'REIT' },
    ],
    aggressive: [
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', percentage: 70, color: 'hsl(var(--chart-1))', assetType: 'US Equity' },
      { ticker: 'VXUS', name: 'Vanguard Total International Stock ETF', percentage: 20, color: 'hsl(var(--chart-2))', assetType: 'International Equity' },
      { ticker: 'QQQ', name: 'Invesco QQQ Trust', percentage: 10, color: 'hsl(var(--chart-5))', assetType: 'US Growth' },
    ],
  };

  let allocations = ETF_SETS[riskTolerance] || ETF_SETS['moderate'];

  // Apply dividend vs growth adjustments
  if (dividendVsGrowth === 'dividend-focus') {
    // Replace some growth-oriented ETFs with dividend-focused ones
    allocations = allocations.map((a) => {
      if (a.ticker === 'VTI') return { ...a, ticker: 'VIG', name: 'Vanguard Dividend Appreciation ETF', assetType: 'US Dividend Equity' };
      if (a.ticker === 'VXUS') return { ...a, ticker: 'VYMI', name: 'Vanguard International High Dividend Yield ETF', assetType: 'International Dividend Equity' };
      if (a.ticker === 'QQQ') return { ...a, ticker: 'VIG', name: 'Vanguard Dividend Appreciation ETF', assetType: 'US Dividend Equity' };
      return a;
    });
  } else if (dividendVsGrowth === 'growth-focus') {
    // Emphasize growth-oriented ETFs
    allocations = allocations.map((a) => {
      if (a.ticker === 'VTI' && allocations.some(alloc => alloc.ticker === 'QQQ')) {
        // If QQQ is already present, keep the balance but ensure growth focus
        return a;
      }
      if (a.ticker === 'VXUS') return { ...a, ticker: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', assetType: 'Emerging Markets Equity' };
      return a;
    });
  }
  // For 'balanced', keep the original allocations

  // Apply ESG transformations based on exclusions
  // If user excludes non-ESG funds, use ESG-focused alternatives
  const esgExclusionsArray = Array.isArray(esgExclusions) ? esgExclusions : [];
  const excludeNonEsgFunds = esgExclusionsArray.includes('non-esg-funds');
  
  if (excludeNonEsgFunds) {
    allocations = allocations.map((a) => {
      if (a.ticker === 'VTI') return { ...a, ticker: 'ESGV', name: 'Vanguard ESG U.S. Stock ETF', assetType: 'US Equity' };
      if (a.ticker === 'VIG') return { ...a, ticker: 'ESGD', name: 'iShares ESG Aware MSCI EAFE ETF', assetType: 'International Equity' };
      if (a.ticker === 'VXUS') return { ...a, ticker: 'ESGD', name: 'iShares ESG Aware MSCI EAFE ETF', assetType: 'International Equity' };
      if (a.ticker === 'BND') return { ...a, ticker: 'SUSB', name: 'iShares ESG Aware USD Corporate Bond ETF', assetType: 'Bonds' };
      return a;
    });
  }

  // Apply geographic focus filtering
  // If only US is selected, remove international exposure
  if (geographicFocusArray.length === 1 && geographicFocusArray.includes('united-states')) {
    const removedWeight = allocations
      .filter((a) => a.ticker === 'VXUS' || a.ticker === 'ESGD' || a.ticker === 'VYMI' || a.ticker === 'VWO')
      .reduce((sum, a) => sum + a.percentage, 0);
    allocations = allocations.filter((a) => a.ticker !== 'VXUS' && a.ticker !== 'ESGD' && a.ticker !== 'VYMI' && a.ticker !== 'VWO').map((a) => ({ ...a }));
    const usPosition = allocations.find((a) => a.ticker === 'VTI' || a.ticker === 'ESGV' || a.ticker === 'VIG') || allocations.find((a) => a.ticker === 'QQQ');
    if (usPosition) usPosition.percentage += removedWeight;
  }
  // For now, if multiple regions or non-US regions are selected, keep the global allocation
  // Future enhancement: adjust allocations based on specific regional preferences

  // Ensure total equals 100%
  return normalizeAllocationsTo100(allocations);
}

