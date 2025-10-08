import { Router, type Express } from 'express';
import { createServer, type Server } from 'http';
import passport from 'passport';
import { setupPassportStrategy, createSessionMiddleware } from '../middleware/auth.middleware';
import { userRepository, assessmentRepository } from '../repositories';
import { logger } from '../logger';

// Import route modules
import authRoutes from './auth.routes';
import portfolioRoutes from './portfolio.routes';
import assessmentRoutes from './assessment.routes';
import marketDataRoutes from './market-data.routes';
import chatRoutes from './chat.routes';

/**
 * Register all application routes and middleware
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Validate required environment variables
  const requiredEnvVars = ['SESSION_SECRET', 'DATABASE_URL', 'PASSWORD_PEPPER'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    logger.error('Missing required environment variables:', missingVars);
    throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
  }

  logger.info('All required environment variables are set');

  // Setup authentication
  app.use(createSessionMiddleware());
  app.use(passport.initialize());
  app.use(passport.session());
  setupPassportStrategy();

  // Register route modules
  app.use('/api/auth', authRoutes);
  app.use('/api/portfolio', portfolioRoutes);
  app.use('/api/risk-assessment', assessmentRoutes);
  app.use('/api/etf', marketDataRoutes);
  app.use('/api/portfolio', chatRoutes);

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

  // Cleanup expired tokens on startup (wrapped for safety)
  try {
    await userRepository.deleteExpiredPasswordResetTokens();
    await userRepository.deleteExpiredEmailChangeTokens();
    await userRepository.hardDeleteOldUsers();
  } catch (err) {
    logger.warn('Failed to cleanup expired tokens on startup:', err);
  }

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}

