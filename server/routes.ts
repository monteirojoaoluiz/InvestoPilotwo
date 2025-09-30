// Reference: javascript_log_in_with_replit integration
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRiskAssessmentSchema, insertPortfolioMessageSchema } from "@shared/schema";
import { z } from "zod";
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

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

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

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
      if (!user.password) {
        return done(null, false, { message: 'This account was created with magic link. Please use the magic link to sign in or reset your password.' });
      }

      // Check password with pepper
      const pepperedPassword = password + PEPPER;
      const isValidPassword = await bcrypt.compare(pepperedPassword, user.password);
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
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// Validation middleware
const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
};

// Validation rules for auth endpoints
const registerValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'),
  handleValidationErrors,
];

const loginValidation = [
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

const emailValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  handleValidationErrors,
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'),
  handleValidationErrors,
];

// Rate limiters for authentication endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Use IP as identifier
  keyGenerator: (req) => req.ip || 'unknown',
});

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per hour
  message: { message: 'Too many registration attempts. Please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
});

const magicLinkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 magic link requests per hour
  message: { message: 'Too many magic link requests. Please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  message: { message: 'Too many password reset requests. Please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
});

// Setup SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Password hashing utilities
const saltRounds = 12;
const PEPPER = process.env.PASSWORD_PEPPER || 'default-pepper-change-in-production';

export async function registerRoutes(app: Express): Promise<Server> {
  // Validate required environment variables
  const requiredEnvVars = ['SESSION_SECRET', 'DATABASE_URL', 'PASSWORD_PEPPER'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
  }

  console.log('All required environment variables are set');

  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Password-based auth routes
  app.post('/api/auth/register', registrationLimiter, registerValidation, async (req, res) => {
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
      req.login(user, (err) => {
        if (err) {
          console.error('Auto-login error:', err);
          return res.status(500).json({ message: 'Registration successful, but login failed' });
        }
        res.json({ message: 'Registration successful', user: { id: user.id, email: user.email } });
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', loginLimiter, loginValidation, (req, res, next) => {
    console.log('Login attempt for:', req.body.email);
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Login failed' });
      }

      if (!user) {
        console.log('Login failed - invalid credentials for:', req.body.email);
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }

      console.log('Login successful for user:', user.email);
      req.login(user, (err) => {
        if (err) {
          console.error('Session login error:', err);
          return res.status(500).json({ message: 'Login failed' });
        }

        console.log('Session created for user:', user.email);
        res.json({ message: 'Login successful', user: { id: user.id, email: user.email } });
      });
    })(req, res, next);
  });

  // Auth routes
  app.post('/api/auth/send', magicLinkLimiter, emailValidation, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'Email required' });
      }

      // Check or create user
      let user = await storage.getUserByEmail(email); // Assume add this method
      if (!user) {
        user = await storage.createUser({ email, firstName: '', lastName: '', profileImageUrl: '' });
      }

      // Generate token
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

      const tokenData: InsertAuthTokenInput = {
        email,
        token,
        expiresAt,
      };

      await storage.createAuthToken(tokenData);

      // Send email
      const msg = {
        to: email,
        from: 'monteirojoaoluiz@gmail.com', // TODO: set verified sender
        subject: 'Your InvestoPilot Magic Link',
        html: `
          <h1>Sign in to InvestoPilot</h1>
          <p>Click the link below to sign in to your account:</p>
          <a href="${process.env.FRONTEND_URL}/api/auth/verify?token=${token}">Sign In</a>
          <p>This link expires in 15 minutes.</p>
        `,
      };

      await sgMail.send(msg);

      res.json({ message: 'Magic link sent to your email' });
    } catch (error) {
      console.error('Error sending magic link:', error);
      res.status(500).json({ message: 'Failed to send email' });
    }
  });

  app.get('/api/auth/verify', async (req, res) => {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).redirect('/?error=no_token');
      }

      const authToken = await storage.getAuthTokenByToken(token as string);
      if (!authToken || authToken.used || new Date() > authToken.expiresAt) {
        return res.status(400).redirect('/?error=invalid_token');
      }

      // Get user
      let user = await storage.getUserByEmail(authToken.email);
      if (!user) {
        user = await storage.createUser({ email: authToken.email, firstName: '', lastName: '', profileImageUrl: '' });
      }

      // Mark token used
      await storage.markTokenAsUsed(authToken.id);

      // Login user
      req.login(user, (err) => {
        if (err) {
          return res.status(500).redirect('/?error=login_failed');
        }
        res.redirect('/dashboard');
      });
    } catch (error) {
      console.error('Error verifying token:', error);
      res.status(500).redirect('/?error=server_error');
    }
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      console.log('User auth check - user:', req.user?.email);
      res.json(req.user);
    } catch (error) {
      console.error('User fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Password reset routes
  app.post('/api/auth/forgot-password', passwordResetLimiter, emailValidation, async (req, res) => {
    try {
      const { email } = req.body;

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
      }

      // Generate secure reset token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

      // Store reset token
      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt,
        used: false,
      });

      // Send reset email
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
      const msg = {
        to: email,
        from: 'monteirojoaoluiz@gmail.com',
        subject: 'Reset Your InvestoPilot Password',
        html: `
          <h1>Password Reset Request</h1>
          <p>You requested to reset your password for your InvestoPilot account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      };

      await sgMail.send(msg);

      res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ message: 'Failed to process password reset request' });
    }
  });

  app.post('/api/auth/reset-password', resetPasswordValidation, async (req, res) => {
    try {
      const { token, password } = req.body;

      // Get and validate reset token
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken || resetToken.used || new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      // Hash new password with pepper
      const pepperedPassword = password + PEPPER;
      const hashedPassword = await bcrypt.hash(pepperedPassword, saltRounds);

      // Update user password
      await storage.updateUserPassword(resetToken.userId, hashedPassword);

      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(resetToken.id);

      res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: 'Failed to reset password' });
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
      user: req.user ? { id: req.user.id, email: req.user.email } : null,
    });
  });

  // Cleanup expired tokens (call periodically or on startup)
  await storage.deleteExpiredTokens();
  await storage.deleteExpiredPasswordResetTokens();

  // Risk assessment routes
  app.post('/api/risk-assessment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertRiskAssessmentSchema.parse(req.body);
      
      const assessment = await storage.createRiskAssessment({
        ...validatedData,
        userId,
      });
      
      res.json(assessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating risk assessment:", error);
      res.status(500).json({ message: "Failed to create risk assessment" });
    }
  });

  app.get('/api/risk-assessment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const assessment = await storage.getRiskAssessmentByUserId(userId);
      res.json(assessment);
    } catch (error) {
      console.error("Error fetching risk assessment:", error);
      res.status(500).json({ message: "Failed to fetch risk assessment" });
    }
  });

  // Portfolio routes
  app.post('/api/portfolio/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.get('/api/portfolio', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      console.error("Error fetching portfolio for user:", req.user?.id || 'unknown', "Full error:", error);
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  // ETF market data routes
  app.get('/api/etf/:ticker/history', isAuthenticated, async (req: any, res) => {
    try {
      const { ticker } = req.params as { ticker: string };
      const { range = '1y', interval = '1wk' } = req.query as { range?: string; interval?: string };

      const now = new Date();
      const period2 = now;
      const period1 = new Date(now);
      const r = (range || '1y').toLowerCase();
      if (r.includes('3y')) period1.setFullYear(period1.getFullYear() - 3);
      else if (r.includes('5y')) period1.setFullYear(period1.getFullYear() - 5);
      else if (r.includes('6m') || r.includes('6mo')) period1.setMonth(period1.getMonth() - 6);
      else period1.setFullYear(period1.getFullYear() - 1);

      const result = await yahooFinance.chart(ticker, {
        period1,
        period2,
        interval: interval as any,
      } as any);

      const points = (result.quotes || []).map((q: any) => ({
        date: q.date instanceof Date ? q.date.toISOString().slice(0, 10) : q.date,
        close: q.close,
      })).filter((p: any) => typeof p.close === 'number');

      res.json({ ticker, range, interval, points });
    } catch (error) {
      console.error('Error fetching ETF history:', error);
      res.status(500).json({ message: 'Failed to fetch ETF history' });
    }
  });

  // Combined portfolio performance (3y daily, normalized to 100)
  app.get('/api/portfolio/performance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
        .filter((a) => a && typeof a.percentage === 'number' && a.percentage! > 0 && typeof a.ticker === 'string')
        .map((a) => ({ ticker: (a.ticker as string).toUpperCase(), weight: (a.percentage as number) / 100 }));

      // Normalize weights to sum to 1
      const totalWeight = tickers.reduce((sum, t) => sum + t.weight, 0);
      if (totalWeight > 0) {
        tickers = tickers.map((t) => ({ ...t, weight: t.weight / totalWeight }));
      }

      if (tickers.length === 0) {
        return res.json({ points: [] });
      }

      // Yahoo requires UTC dates; set to midnight UTC for stability
      const now = new Date();
      const period2 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const threeYearsAgo = new Date(period2);
      threeYearsAgo.setUTCFullYear(threeYearsAgo.getUTCFullYear() - 3);
      const period1 = threeYearsAgo;

      const charts = await Promise.all(
        tickers.map(async (t) => {
          const chart: any = await yahooFinance.chart(t.ticker, { period1, period2, interval: '1d' } as any);

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

          return { ticker: t.ticker, weight: t.weight, points };
        })
      );

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
      res.status(500).json({ message: 'Failed to compute performance' });
    }
  });

  // Portfolio chat routes
  app.get('/api/portfolio/:portfolioId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const { portfolioId } = req.params;
      const messages = await storage.getPortfolioMessages(portfolioId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.delete('/api/portfolio/:portfolioId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const { portfolioId } = req.params;
      const userId = req.user.id;

      // Verify the portfolio belongs to the user
      const portfolio = await storage.getPortfolioByUserId(userId);
      if (!portfolio || portfolio.id !== portfolioId) {
        return res.status(403).json({ message: "Unauthorized to delete messages for this portfolio" });
      }

      await storage.deletePortfolioMessages(portfolioId);
      res.json({ message: "All messages deleted successfully" });
    } catch (error) {
      console.error("Error deleting messages:", error);
      res.status(500).json({ message: "Failed to delete messages" });
    }
  });

  app.post('/api/portfolio/:portfolioId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { portfolioId } = req.params;
      const validatedData = insertPortfolioMessageSchema.parse(req.body);
      
      const userMessage = await storage.createPortfolioMessage({
        ...validatedData,
        sender: 'user',
        userId,
        portfolioId,
      });

      const portfolio = await storage.getPortfolioByUserId(userId);
      if (!portfolio) {
        return res.status(400).json({ message: 'Portfolio not found' });
      }

      // allocations are stored as jsonb; they are already an object
      const allocations = (portfolio as any).allocations;
      const prompt = `You are a financial advisor for InvestoPilot. The user's portfolio has allocations: ${JSON.stringify(allocations)}. Total value: $${portfolio.totalValue}. User asked: ${validatedData.content}. Provide helpful, professional advice.`;

      try {
        const completion = await groqClient.chat.completions.create({
          model: 'openai/gpt-oss-120b',
          messages: [
            {
              role: 'system',
              content:
                'You are InvestoPilot, a professional AI financial co-pilot. You ONLY answer questions related to the user\'s portfolio, investments, and financial planning. If a question is not related to finance, investing, or the user\'s portfolio, politely decline to answer and redirect back to portfolio-related topics. When answering: 1) ground your advice in the provided allocations and totals, 2) explain reasoning and tradeoffs, 3) be conservative with claims, 4) avoid providing individualized investment advice; include a short disclaimer that you are not a licensed advisor.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.5,
        });

        const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
        
        const aiMessage = await storage.createPortfolioMessage({
          content: aiResponse,
          sender: 'ai',
          userId,
          portfolioId,
        });
        
        res.json({ userMessage, aiMessage });
      } catch (error) {
        console.error('Groq API error:', error);
        res.status(500).json({ message: 'Failed to generate AI response' });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
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
  const { riskTolerance, usOnly, esgOnly } = assessment;

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

  // Apply ESG transformations first
  if (esgOnly) {
    allocations = allocations.map((a) => {
      if (a.ticker === 'VTI') return { ...a, ticker: 'ESGV', name: 'Vanguard ESG U.S. Stock ETF', assetType: 'US Equity' };
      if (a.ticker === 'VXUS') return { ...a, ticker: 'ESGD', name: 'iShares ESG Aware MSCI EAFE ETF', assetType: 'International Equity' };
      if (a.ticker === 'BND') return { ...a, ticker: 'SUSB', name: 'iShares ESG Aware USD Corporate Bond ETF', assetType: 'Bonds' };
      return a;
    });
  }

  // Then apply US-only filtering
  if (usOnly) {
    const removedWeight = allocations
      .filter((a) => a.ticker === 'VXUS' || a.ticker === 'ESGD') // Handle both regular and ESG versions
      .reduce((sum, a) => sum + a.percentage, 0);
    allocations = allocations.filter((a) => a.ticker !== 'VXUS' && a.ticker !== 'ESGD').map((a) => ({ ...a }));
    const usPosition = allocations.find((a) => a.ticker === 'VTI' || a.ticker === 'ESGV') || allocations.find((a) => a.ticker === 'QQQ');
    if (usPosition) usPosition.percentage += removedWeight;
  }

  // Ensure total equals 100%
  return normalizeAllocationsTo100(allocations);
}

