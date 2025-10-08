import type { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { pool } from '../db';
import { userRepository } from '../repositories';
import { authConfig, getPasswordPepper, getSessionSecret } from '../config/auth.config';

/**
 * Setup passport local strategy for email/password authentication
 */
export function setupPassportStrategy(): void {
  const PEPPER = getPasswordPepper();

  passport.use(new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const user = await userRepository.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Check if user has a password
        if (!(user as any).password) {
          return done(null, false, { 
            message: 'This account was created with magic link. Please use the magic link to sign in or reset your password.' 
          });
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
      const user = await userRepository.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}

/**
 * Create session middleware
 */
export function createSessionMiddleware() {
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    pool: pool,
    createTableIfMissing: true,
    ttl: authConfig.session.ttl,
    tableName: authConfig.session.tableName,
  });

  return session({
    secret: getSessionSecret(),
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: authConfig.session.ttl,
      sameSite: 'lax',
    },
  });
}

/**
 * Middleware to check if user is authenticated
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

/**
 * Hash password with pepper
 */
export async function hashPassword(password: string): Promise<string> {
  const PEPPER = getPasswordPepper();
  const pepperedPassword = password + PEPPER;
  return await bcrypt.hash(pepperedPassword, authConfig.bcrypt.saltRounds);
}

/**
 * Verify password with pepper
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const PEPPER = getPasswordPepper();
  const pepperedPassword = password + PEPPER;
  return await bcrypt.compare(pepperedPassword, hashedPassword);
}

