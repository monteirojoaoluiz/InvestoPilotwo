// Reference: javascript_log_in_with_replit integration
import sgMail from "@sendgrid/mail";
import {
  insertRiskAssessmentSchema,
  insertPortfolioMessageSchema,
} from "@shared/schema";
import { authTokens, insertAuthTokenSchema } from "@shared/schema";
import type { AuthToken, InsertAuthTokenInput } from "@shared/schema";
import bcrypt from "bcrypt";
import connectPg from "connect-pg-simple";
import crypto from "crypto";
import type { Express, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import session from "express-session";
import { body, validationResult } from "express-validator";
import { Groq } from "groq-sdk";
import { createServer, type Server } from "http";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import yahooFinance from "yahoo-finance2";
import { z } from "zod";

import { pool } from "./db";
import { storage } from "./storage";

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

// Enhanced in-memory cache for Yahoo Finance data
const yahooCache = new Map<string, { data: any; timestamp: number }>();
const HISTORY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for historical data
const INFO_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for quote/info data

async function getCachedYahooData(
  ticker: string,
  period1?: Date,
  period2?: Date,
  interval?: string,
) {
  const cacheKey =
    period1 && period2 && interval
      ? `hist-${ticker}-${period1.getTime()}-${period2.getTime()}-${interval}`
      : `info-${ticker}`;
  const cached = yahooCache.get(cacheKey);

  const cacheDuration = period1 ? HISTORY_CACHE_DURATION : INFO_CACHE_DURATION;

  if (cached && Date.now() - cached.timestamp < cacheDuration) {
    console.log(`Cache hit for ${ticker} (${period1 ? "history" : "info"})`);
    return cached.data;
  }

  return null;
}

function setCachedYahooData(
  ticker: string,
  data: any,
  period1?: Date,
  period2?: Date,
  interval?: string,
) {
  const cacheKey =
    period1 && period2 && interval
      ? `hist-${ticker}-${period1.getTime()}-${period2.getTime()}-${interval}`
      : `info-${ticker}`;
  yahooCache.set(cacheKey, { data, timestamp: Date.now() });

  // Log cache size periodically for monitoring
  if (yahooCache.size % 50 === 0) {
    console.log(`Yahoo Finance cache size: ${yahooCache.size} entries`);
  }
}

// Clean up old cache entries periodically
setInterval(
  () => {
    const now = Date.now();
    let deletedCount = 0;

    for (const [key, value] of Array.from(yahooCache.entries())) {
      const isHistory = key.startsWith("hist-");
      const duration = isHistory ? HISTORY_CACHE_DURATION : INFO_CACHE_DURATION;

      if (now - value.timestamp > duration * 2) {
        // Keep for 2x cache duration before cleanup
        yahooCache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(
        `Cleaned up ${deletedCount} expired cache entries. Current size: ${yahooCache.size}`,
      );
    }
  },
  15 * 60 * 1000,
); // Run cleanup every 15 minutes

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
      secure: process.env.NODE_ENV === "production", // Only secure in production
      maxAge: sessionTtl,
      sameSite: "lax", // Allow cross-site requests
    },
  });
};

// Local strategy for email/password authentication
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }

        // Check if user has a password (new users) or is legacy user without password
        if (!(user as any).password) {
          return done(null, false, {
            message:
              "This account was created with magic link. Please use the magic link to sign in or reset your password.",
          });
        }

        // Check password with pepper
        const pepperedPassword = password + PEPPER;
        const isValidPassword = await bcrypt.compare(
          pepperedPassword,
          (user as any).password,
        );
        if (!isValidPassword) {
          return done(null, false, { message: "Invalid email or password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

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

const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Validation middleware
const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: errors.array() });
  }
  next();
};

// Validation rules for auth endpoints
const registerValidation = [
  body("email")
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    )
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
    ),
  handleValidationErrors,
];

const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

const emailValidation = [
  body("email")
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  handleValidationErrors,
];

const changeEmailValidation = [
  body("newEmail")
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  handleValidationErrors,
];

const resetPasswordValidation = [
  body("token").notEmpty().withMessage("Reset token is required"),
  body("password")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    )
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
    ),
  handleValidationErrors,
];

// Add change password validation after resetPasswordValidation
const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 8, max: 128 })
    .withMessage("New password must be between 8 and 128 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    )
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
    ),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
  handleValidationErrors,
];

const deleteAccountValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  handleValidationErrors,
];

// Rate limiters for authentication endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Remove custom keyGenerator to use default (which handles IPv6 properly)
});

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per hour
  message: {
    message: "Too many registration attempts. Please try again after an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const magicLinkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 magic link requests per hour
  message: {
    message: "Too many magic link requests. Please try again after an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  message: {
    message:
      "Too many password reset requests. Please try again after an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const emailChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 email change requests per hour
  message: {
    message: "Too many email change requests. Please try again after an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Setup SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Password hashing utilities
const saltRounds = 12;
const PEPPER =
  process.env.PASSWORD_PEPPER || "default-pepper-change-in-production";

export async function registerRoutes(app: Express): Promise<Server> {
  // Validate required environment variables
  const requiredEnvVars = ["SESSION_SECRET", "DATABASE_URL", "PASSWORD_PEPPER"];
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    console.error("Missing required environment variables:", missingVars);
    throw new Error(`Missing environment variables: ${missingVars.join(", ")}`);
  }

  console.log("All required environment variables are set");

  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Password-based auth routes
  app.post(
    "/api/auth/register",
    registrationLimiter,
    registerValidation,
    async (req: Request, res: Response) => {
      try {
        const { email, password } = req.body;

        // Check if user already exists
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res
            .status(400)
            .json({ message: "User with this email already exists" });
        }

        // Hash password with pepper
        const pepperedPassword = password + PEPPER;
        const hashedPassword = await bcrypt.hash(pepperedPassword, saltRounds);

        // Create user
        const user = await storage.createUser({
          email,
          password: hashedPassword,
          firstName: "",
          lastName: "",
          profileImageUrl: "",
        });

        // Auto-login after registration
        req.login(user, async (err: any) => {
          if (err) {
            console.error("Auto-login error:", err);
            return res
              .status(500)
              .json({ message: "Registration successful, but login failed" });
          }
          try {
            await storage.updateUserLastLogin((user as any).id);
          } catch (updateErr) {
            console.error(
              "Failed to update last login on register:",
              updateErr,
            );
          }
          res.json({
            message: "Registration successful",
            user: { id: (user as any).id, email: (user as any).email },
          });
        });
      } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Registration failed" });
      }
    },
  );

  app.post(
    "/api/auth/login",
    loginLimiter,
    loginValidation,
    (req: Request, res: Response, next: NextFunction) => {
      console.log("Login attempt for:", req.body.email);
      passport.authenticate("local", async (err: any, user: any, info: any) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Login failed" });
        }

        if (!user) {
          console.log(
            "Login failed - invalid credentials for:",
            req.body.email,
          );
          return res
            .status(401)
            .json({ message: info?.message || "Invalid credentials" });
        }

        console.log("Login successful for user:", (user as any).email);
        req.login(user, async (err: any) => {
          if (err) {
            console.error("Session login error:", err);
            return res.status(500).json({ message: "Login failed" });
          }

          console.log("Session created for user:", (user as any).email);
          try {
            await storage.updateUserLastLogin((user as any).id);
          } catch (updateErr) {
            console.error("Failed to update last login on login:", updateErr);
          }
          res.json({
            message: "Login successful",
            user: { id: (user as any).id, email: (user as any).email },
          });
        });
      })(req, res, next);
    },
  );

  // Auth routes
  app.post(
    "/api/auth/send",
    magicLinkLimiter,
    emailValidation,
    async (req: Request, res: Response) => {
      try {
        const { email } = req.body;
        if (!email) {
          return res.status(400).json({ message: "Email required" });
        }

        // Check or create user
        let user = await storage.getUserByEmail(email); // Assume add this method
        if (!user) {
          user = await storage.createUser({
            email,
            firstName: "",
            lastName: "",
            profileImageUrl: "",
          });
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
          from: "monteirojoaoluiz@gmail.com", // TODO: set verified sender
          subject: "Your Stack16 Magic Link",
          html: `
          <h1>Sign in to Stack16</h1>
          <p>Click the link below to sign in to your account:</p>
          <a href="${process.env.FRONTEND_URL}/api/auth/verify?token=${token}">Sign In</a>
          <p>This link expires in 15 minutes.</p>
        `,
        };

        await sgMail.send(msg);

        res.json({ message: "Magic link sent to your email" });
      } catch (error) {
        console.error("Error sending magic link:", error);
        res.status(500).json({ message: "Failed to send email" });
      }
    },
  );

  app.get("/api/auth/verify", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).redirect("/?error=no_token");
      }

      const authToken = await storage.getAuthTokenByToken(token as string);
      if (!authToken || authToken.used || new Date() > authToken.expiresAt) {
        return res.status(400).redirect("/?error=invalid_token");
      }

      // Get user
      let user = await storage.getUserByEmail(authToken.email);
      if (!user) {
        user = await storage.createUser({
          email: authToken.email,
          firstName: "",
          lastName: "",
          profileImageUrl: "",
        });
      }

      // Mark token used
      await storage.markTokenAsUsed(authToken.id);

      // Login user
      req.login(user, async (err: any) => {
        if (err) {
          return res.status(500).redirect("/?error=login_failed");
        }
        try {
          await storage.updateUserLastLogin((user as any).id);
        } catch (updateErr) {
          console.error(
            "Failed to update last login on magic link:",
            updateErr,
          );
        }
        res.redirect("/dashboard");
      });
    } catch (error) {
      console.error("Error verifying token:", error);
      res.status(500).redirect("/?error=server_error");
    }
  });

  app.get(
    "/api/auth/user",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        console.log("User auth check - user:", (req.user as any)?.email);
        res.json(req.user);
      } catch (error) {
        console.error("User fetch error:", error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
    },
  );

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Password reset routes
  app.post(
    "/api/auth/forgot-password",
    passwordResetLimiter,
    emailValidation,
    async (req: Request, res: Response) => {
      try {
        const { email } = req.body;

        // Check if user exists
        const user = await storage.getUserByEmail(email);
        if (!user) {
          // Don't reveal if user exists or not for security
          return res.json({
            message:
              "If an account with that email exists, a password reset link has been sent.",
          });
        }

        // Generate secure reset token
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

        // Store reset token
        await storage.createPasswordResetToken({
          userId: (user as any).id,
          token,
          expiresAt,
          used: false,
        });

        // Send reset email
        const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5000"}/reset-password?token=${token}`;
        const msg = {
          to: email,
          from: "monteirojoaoluiz@gmail.com",
          subject: "Reset Your Stack16 Password",
          html: `
          <h1>Password Reset Request</h1>
          <p>You requested to reset your password for your Stack16 account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
        };

        await sgMail.send(msg);

        res.json({
          message:
            "If an account with that email exists, a password reset link has been sent.",
        });
      } catch (error) {
        console.error("Password reset request error:", error);
        res
          .status(500)
          .json({ message: "Failed to process password reset request" });
      }
    },
  );

  app.post(
    "/api/auth/reset-password",
    resetPasswordValidation,
    async (req: Request, res: Response) => {
      try {
        const { token, password } = req.body;

        // Get and validate reset token
        const resetToken = await storage.getPasswordResetToken(token);
        if (
          !resetToken ||
          resetToken.used ||
          new Date() > resetToken.expiresAt
        ) {
          return res
            .status(400)
            .json({ message: "Invalid or expired reset token" });
        }

        // Hash new password with pepper
        const pepperedPassword = password + PEPPER;
        const hashedPassword = await bcrypt.hash(pepperedPassword, saltRounds);

        // Update user password
        await storage.updateUserPassword(resetToken.userId, hashedPassword);

        // Mark token as used
        await storage.markPasswordResetTokenAsUsed(resetToken.id);

        res.json({
          message:
            "Password has been reset successfully. You can now log in with your new password.",
        });
      } catch (error) {
        console.error("Password reset error:", error);
        res.status(500).json({ message: "Failed to reset password" });
      }
    },
  );

  // Add change password route after password reset routes
  app.post(
    "/api/auth/change-password",
    isAuthenticated,
    changePasswordValidation,
    async (req: Request, res: Response) => {
      try {
        const { currentPassword, newPassword } = req.body;
        const user = req.user;

        if (!(user as any).password) {
          return res.status(400).json({
            message:
              "This account does not have a password set. Use password reset to set one.",
          });
        }

        // Verify current password
        const pepperedCurrent = currentPassword + PEPPER;
        const isValidCurrent = await bcrypt.compare(
          pepperedCurrent,
          (user as any).password,
        );
        if (!isValidCurrent) {
          return res
            .status(400)
            .json({ message: "Current password is incorrect" });
        }

        // Hash new password
        const pepperedNew = newPassword + PEPPER;
        const hashedNew = await bcrypt.hash(pepperedNew, saltRounds);

        // Update password
        await storage.updateUserPassword((user as any).id, hashedNew);

        res.json({ message: "Password changed successfully" });
      } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ message: "Failed to change password" });
      }
    },
  );

  app.post(
    "/api/auth/change-email",
    isAuthenticated,
    emailChangeLimiter,
    changeEmailValidation,
    async (req: Request, res: Response) => {
      try {
        const { newEmail } = req.body;
        const user = req.user;

        if (newEmail === (user as any).email) {
          return res
            .status(400)
            .json({ message: "New email cannot be the same as current email" });
        }

        // Check if new email already exists
        const existingUser = await storage.getUserByEmail(newEmail);
        if (existingUser) {
          return res
            .status(400)
            .json({ message: "Email already in use by another account" });
        }

        // Generate secure token
        const token = crypto.randomBytes(32).toString("hex");
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
        const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:5000"}/verify-email-change?token=${token}`;
        const msg = {
          to: newEmail,
          from: "monteirojoaoluiz@gmail.com",
          subject: "Confirm Your Email Change - Stack16",
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

        res.json({
          message:
            "Verification email sent to new address. Please check your email to confirm the change.",
        });
      } catch (error) {
        console.error("Email change request error:", error);
        res
          .status(500)
          .json({ message: "Failed to process email change request" });
      }
    },
  );

  app.post(
    "/api/auth/delete-account",
    isAuthenticated,
    deleteAccountValidation,
    async (req: Request, res: Response) => {
      try {
        const { currentPassword } = req.body;
        const user = req.user;

        if (!(user as any).password) {
          return res.status(400).json({
            message:
              "Cannot delete account without password verification. Please set a password first.",
          });
        }

        // Verify current password
        const pepperedCurrent = currentPassword + PEPPER;
        const isValidCurrent = await bcrypt.compare(
          pepperedCurrent,
          (user as any).password,
        );
        if (!isValidCurrent) {
          return res.status(400).json({ message: "Password incorrect" });
        }

        // Send farewell email
        const farewellMsg = {
          to: (user as any).email,
          from: "monteirojoaoluiz@gmail.com",
          subject: "Account Deleted - Stack16",
          html: `
          <h1>Your Stack16 Account Has Been Deleted</h1>
          <p>This is to confirm that your account has been permanently deleted as per your request.</p>
          <p>If this was a mistake, unfortunately we cannot recover deleted accounts.</p>
          <p>Thank you for using Stack16. We wish you the best in your investment journey!</p>
        `,
        };

        await sgMail.send(farewellMsg).catch(console.error); // non-blocking

        // Delete user data
        await storage.deleteUserData((user as any).id);

        // Logout
        req.logout((err) => {
          if (err) console.error("Logout error on delete:", err);
        });

        res.json({
          message: "Account deleted successfully. All data has been removed.",
        });
      } catch (error) {
        console.error("Delete account error:", error);
        res.status(500).json({ message: "Failed to delete account" });
      }
    },
  );

  app.get(
    "/api/auth/download-data",
    isAuthenticated,
    async (req: Request, res: Response) => {
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
          riskAssessments: await storage.getRiskAssessmentsByUserId(
            (user as any).id,
          ),
          portfolioRecommendations:
            await storage.getPortfolioRecommendationsByUserId((user as any).id),
          portfolioMessages: await storage.getPortfolioMessagesByUserId(
            (user as any).id,
          ),
          exportedAt: new Date().toISOString(),
          version: "1.0",
        };

        // Create filename with timestamp
        const timestamp = new Date().toISOString().split("T")[0];
        const filename = `stack16-data-${(user as any).email}-${timestamp}.json`;

        // Set headers for file download
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`,
        );

        res.json(userData);
      } catch (error) {
        console.error("Download data error:", error);
        res.status(500).json({ message: "Failed to download data" });
      }
    },
  );

  app.get(
    "/api/auth/verify-email-change",
    async (req: Request, res: Response) => {
      try {
        const { token } = req.query;
        if (!token) {
          return res.status(400).redirect("/account?error=no_token");
        }

        const emailToken = await storage.getEmailChangeTokenByToken(
          token as string,
        );
        if (
          !emailToken ||
          emailToken.used ||
          new Date() > emailToken.expiresAt
        ) {
          return res.status(400).redirect("/account?error=invalid_token");
        }

        // Update user email
        await storage.updateUserEmail(
          emailToken.userId,
          emailToken.pendingEmail,
        );

        // Mark token as used
        await storage.markEmailChangeTokenAsUsed(emailToken.id);

        res.redirect("/account?success=email_changed");
      } catch (error) {
        console.error("Email change verification error:", error);
        res.status(500).redirect("/account?error=server_error");
      }
    },
  );

  // Debug endpoint
  app.get("/api/debug", (req, res) => {
    res.json({
      environment: process.env.NODE_ENV,
      hasSessionSecret: !!process.env.SESSION_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasPasswordPepper: !!process.env.PASSWORD_PEPPER,
      sessionId: req.sessionID,
      isAuthenticated: req.isAuthenticated(),
      user: req.user
        ? { id: (req.user as any).id, email: (req.user as any).email }
        : null,
    });
  });

  // Cleanup expired tokens (wrapped for safety)
  try {
    await storage.deleteExpiredTokens();
  } catch (err) {
    console.warn("Failed to cleanup expired auth tokens:", err);
  }
  try {
    await storage.deleteExpiredPasswordResetTokens();
  } catch (err) {
    console.warn("Failed to cleanup expired password reset tokens:", err);
  }
  try {
    await storage.deleteExpiredEmailChangeTokens();
  } catch (err) {
    console.warn(
      "Failed to cleanup expired email change tokens (table may not exist yet):",
      err,
    );
  }
  try {
    await storage.hardDeleteOldUsers();
  } catch (err) {
    console.warn(
      "Failed to hard delete old users (feature may not be enabled yet):",
      err,
    );
  }

  // Risk assessment routes

  /**
   * Helper function to generate portfolio for a user based on their assessment
   */
  async function generatePortfolioForUser(
    userId: string,
    assessmentId: string,
  ) {
    try {
      console.log(`Auto-generating portfolio for user ${userId}...`);

      const assessment = await storage.getRiskAssessmentByUserId(userId);
      if (!assessment) {
        throw new Error("Assessment not found");
      }

      // Import optimization modules
      const {
        assessmentToRiskProfile,
        mapRiskProfileToParams,
        adjustParamsForEdgeCases,
      } = await import("./portfolioMapping");
      const { getETFUniverse } = await import("./etfDatabase");
      const { filterETFsByConstraints, computePortfolioStatistics } =
        await import("./portfolioStatistics");
      const { optimizePortfolioWithTS } = await import(
        "./portfolioOptimizerTS"
      );

      // Convert assessment to risk profile
      const riskProfile = assessmentToRiskProfile(assessment.answers);
      console.log("Risk profile:", riskProfile);

      // Map to optimization parameters
      let params = mapRiskProfileToParams(riskProfile);
      params = adjustParamsForEdgeCases(params, riskProfile);
      console.log("Optimization parameters:", params);

      // Get ETF universe
      const allETFs = getETFUniverse();
      console.log(`Total ETFs in universe: ${allETFs.length}`);

      // Filter ETFs by constraints
      const filteredETFs = filterETFsByConstraints(
        allETFs,
        params,
        riskProfile.industryExclusions,
      );
      console.log(`Filtered ETFs: ${filteredETFs.length}`);

      if (filteredETFs.length === 0) {
        throw new Error("No ETFs match the investment criteria");
      }

      // Compute statistics
      const stats = computePortfolioStatistics(
        filteredETFs,
        params,
        riskProfile.industryExclusions,
      );
      console.log("Computed portfolio statistics");

      // Run optimization
      const optimizedPortfolio = await optimizePortfolioWithTS(
        filteredETFs,
        stats,
        params,
        riskProfile.industryExclusions,
      );
      console.log("Optimization complete");

      // Convert to storage format
      const allocations = optimizedPortfolio.etfDetails.map((etf) => ({
        ticker: etf.ticker,
        name: etf.name,
        percentage: Math.round(etf.weight * 100 * 100) / 100, // Round to 2 decimals
        assetType:
          filteredETFs.find((e) => e.ticker === etf.ticker)?.assetClass ||
          "equity",
      }));

      // Store portfolio
      const optimizationData = {
        expectedReturn: optimizedPortfolio.expectedReturn,
        expectedVolatility: optimizedPortfolio.expectedVolatility,
        sharpeRatio: optimizedPortfolio.sharpeRatio,
        regionExposure: optimizedPortfolio.regionExposure,
        totalFees: optimizedPortfolio.totalFees,
        constraints: optimizedPortfolio.constraints,
      };

      console.log(
        "Storing optimization data:",
        JSON.stringify(optimizationData, null, 2),
      );

      const portfolio = await storage.createPortfolioRecommendation({
        userId,
        riskAssessmentId: assessmentId,
        allocations,
        optimization: optimizationData,
        totalValue: 0,
        totalReturn: Math.round(optimizedPortfolio.expectedReturn * 100 * 100), // Store as basis points
      });

      console.log(`Portfolio generated successfully for user ${userId}`);
      console.log("Created portfolio ID:", portfolio.id);
      console.log(
        "Created portfolio has optimization?",
        !!portfolio.optimization,
      );
      console.log("Created portfolio optimization:", portfolio.optimization);

      return {
        portfolio,
        optimization: {
          expectedReturn: optimizedPortfolio.expectedReturn,
          expectedVolatility: optimizedPortfolio.expectedVolatility,
          sharpeRatio: optimizedPortfolio.sharpeRatio,
          regionExposure: optimizedPortfolio.regionExposure,
          totalFees: optimizedPortfolio.totalFees,
          constraints: optimizedPortfolio.constraints,
        },
      };
    } catch (error) {
      console.error("Error generating portfolio:", error);
      throw error;
    }
  }

  app.post(
    "/api/risk-assessment",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const userId = (req.user as any).id;
        const answers = req.body;

        console.log(
          "Received risk assessment data:",
          JSON.stringify(answers, null, 2),
        );
        console.log("geographicFocus type:", typeof answers.geographicFocus);
        console.log("geographicFocus value:", answers.geographicFocus);

        // Ensure arrays are properly formatted
        if (
          answers.geographicFocus &&
          !Array.isArray(answers.geographicFocus)
        ) {
          if (typeof answers.geographicFocus === "string") {
            answers.geographicFocus = [answers.geographicFocus];
          } else {
            answers.geographicFocus = [];
          }
        }

        if (answers.esgExclusions && !Array.isArray(answers.esgExclusions)) {
          if (typeof answers.esgExclusions === "string") {
            answers.esgExclusions = [answers.esgExclusions];
          } else {
            answers.esgExclusions = [];
          }
        }

        // Import scoring functions
        const { computeInvestorProfile, validateQuestionnaireAnswers } =
          await import("./profileScoring");

        // Validate questionnaire answers
        const validation = validateQuestionnaireAnswers(answers);
        if (!validation.valid) {
          return res.status(400).json({ message: validation.error });
        }

        // Compute investor profile
        const investorProfile = computeInvestorProfile(answers);

        // Store in database
        const assessmentData = {
          userId,
          answers: answers as any,
          investorProfile: investorProfile as any,
        };

        console.log(
          "Creating risk assessment with computed profile:",
          investorProfile,
        );
        const assessment = await storage.createRiskAssessment(assessmentData);

        // Automatically generate portfolio after assessment is saved
        try {
          console.log(
            "Auto-generating portfolio after assessment completion...",
          );
          await generatePortfolioForUser(userId, assessment.id);
          console.log("Portfolio auto-generation complete");
        } catch (portfolioError) {
          console.error("Failed to auto-generate portfolio:", portfolioError);
          // Don't fail the assessment save if portfolio generation fails
          // User can still see their assessment results
        }

        res.json(assessment);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error("Validation error:", error.errors);
          return res
            .status(400)
            .json({ message: "Invalid data", errors: error.errors });
        }
        console.error("Error creating risk assessment:", error);
        res.status(500).json({ message: "Failed to create risk assessment" });
      }
    },
  );

  app.get(
    "/api/risk-assessment",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const userId = (req.user as any).id;
        const assessment = await storage.getRiskAssessmentByUserId(userId);
        res.json(assessment);
      } catch (error) {
        console.error("Error fetching risk assessment:", error);
        res.status(500).json({ message: "Failed to fetch risk assessment" });
      }
    },
  );

  // Optimized Portfolio Generation (using CVXPY via Pyodide)
  app.post(
    "/api/portfolio/optimize",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const userId = (req.user as any).id;
        const assessment = await storage.getRiskAssessmentByUserId(userId);

        if (!assessment) {
          return res
            .status(400)
            .json({ message: "Please complete risk assessment first" });
        }

        console.log("Starting optimized portfolio generation...");

        // Import optimization modules
        const {
          assessmentToRiskProfile,
          mapRiskProfileToParams,
          adjustParamsForEdgeCases,
        } = await import("./portfolioMapping");
        const { getETFUniverse } = await import("./etfDatabase");
        const { filterETFsByConstraints, computePortfolioStatistics } =
          await import("./portfolioStatistics");
        const { optimizePortfolioWithTS } = await import(
          "./portfolioOptimizerTS"
        );

        // Convert assessment to risk profile
        const riskProfile = assessmentToRiskProfile(assessment.answers);
        console.log("Risk profile:", riskProfile);

        // Map to optimization parameters
        let params = mapRiskProfileToParams(riskProfile);
        params = adjustParamsForEdgeCases(params, riskProfile);
        console.log("Optimization parameters:", params);

        // Get ETF universe
        const allETFs = getETFUniverse();
        console.log(`Total ETFs in universe: ${allETFs.length}`);

        // Filter ETFs by constraints
        const filteredETFs = filterETFsByConstraints(
          allETFs,
          params,
          riskProfile.industryExclusions,
        );
        console.log(`Filtered ETFs: ${filteredETFs.length}`);

        if (filteredETFs.length === 0) {
          return res.status(400).json({
            message:
              "No ETFs match your investment criteria. Please adjust your preferences.",
          });
        }

        // Compute statistics
        const stats = computePortfolioStatistics(
          filteredETFs,
          params,
          riskProfile.industryExclusions,
        );
        console.log("Computed portfolio statistics");

        // Run optimization
        const optimizedPortfolio = await optimizePortfolioWithTS(
          filteredETFs,
          stats,
          params,
          riskProfile.industryExclusions,
        );
        console.log("Optimization complete:", optimizedPortfolio);

        // Convert to storage format
        const allocations = optimizedPortfolio.etfDetails.map((etf) => ({
          ticker: etf.ticker,
          name: etf.name,
          percentage: Math.round(etf.weight * 100 * 100) / 100, // Round to 2 decimals
          assetType:
            filteredETFs.find((e) => e.ticker === etf.ticker)?.assetClass ||
            "equity",
        }));

        // Store portfolio
        const portfolio = await storage.createPortfolioRecommendation({
          userId,
          riskAssessmentId: assessment.id,
          allocations,
          totalValue: 0,
          totalReturn: Math.round(
            optimizedPortfolio.expectedReturn * 100 * 100,
          ), // Store as basis points
        });

        res.json({
          ...portfolio,
          optimization: {
            expectedReturn: optimizedPortfolio.expectedReturn,
            expectedVolatility: optimizedPortfolio.expectedVolatility,
            sharpeRatio: optimizedPortfolio.sharpeRatio,
            regionExposure: optimizedPortfolio.regionExposure,
            totalFees: optimizedPortfolio.totalFees,
            constraints: optimizedPortfolio.constraints,
          },
        });
      } catch (error) {
        console.error("Error optimizing portfolio:", error);
        res.status(500).json({
          message: "Failed to optimize portfolio",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  // Portfolio routes
  app.post(
    "/api/portfolio/generate",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const userId = (req.user as any).id;
        const assessment = await storage.getRiskAssessmentByUserId(userId);

        if (!assessment) {
          return res
            .status(400)
            .json({ message: "Please complete risk assessment first" });
        }

        // Use the same generation logic that includes optimization data
        const result = await generatePortfolioForUser(userId, assessment.id);

        res.json(result.portfolio);
      } catch (error) {
        console.error("Error generating portfolio:", error);
        res.status(500).json({ message: "Failed to generate portfolio" });
      }
    },
  );

  app.get(
    "/api/portfolio",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const userId = (req.user as any).id;
        console.log("Fetching portfolio for userId:", userId);
        const portfolio = await storage.getPortfolioByUserId(userId);

        if (!portfolio) {
          console.log(
            "No portfolio found for user:",
            userId,
            "- returning default portfolio",
          );

          // Return default conservative portfolio when no user portfolio exists
          const defaultPortfolio = {
            id: null,
            totalValue: 0,
            totalReturn: 0,
            allocations: [
              {
                ticker: "BND",
                name: "Vanguard Total Bond Market ETF",
                percentage: 60,
                color: "hsl(var(--chart-3))",
                assetType: "Bonds",
              },
              {
                ticker: "VTI",
                name: "Vanguard Total Stock Market ETF",
                percentage: 25,
                color: "hsl(var(--chart-1))",
                assetType: "US Equity",
              },
              {
                ticker: "VXUS",
                name: "Vanguard Total International Stock ETF",
                percentage: 10,
                color: "hsl(var(--chart-2))",
                assetType: "International Equity",
              },
              {
                ticker: "VNQ",
                name: "Vanguard Real Estate ETF",
                percentage: 5,
                color: "hsl(var(--chart-4))",
                assetType: "REIT",
              },
            ],
          };

          return res.json(defaultPortfolio);
        }

        const response = {
          ...portfolio,
          allocations: portfolio.allocations, // Already parsed object from jsonb
        };

        console.log(
          "Portfolio response includes optimization?",
          !!response.optimization,
        );
        console.log("Response keys:", Object.keys(response));
        if (response.optimization) {
          console.log(
            "Optimization data:",
            JSON.stringify(response.optimization, null, 2),
          );
        } else {
          console.log("Portfolio had optimization?", !!portfolio.optimization);
          console.log("Portfolio optimization:", portfolio.optimization);
        }

        res.json(response);
      } catch (error) {
        console.error(
          "Error fetching portfolio for user:",
          (req.user as any)?.id || "unknown",
          "Full error:",
          error,
        );
        res.status(500).json({ message: "Failed to fetch portfolio" });
      }
    },
  );

  // ETF market data routes
  app.get(
    "/api/etf/:ticker/history",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const { ticker } = req.params as { ticker: string };
        const { range = "1y", interval = "1wk" } = req.query as {
          range?: string;
          interval?: string;
        };

        const now = new Date();
        const period2 = now;
        const period1 = new Date(now);
        const r = (range || "1y").toLowerCase();
        if (r.includes("3y")) period1.setFullYear(period1.getFullYear() - 3);
        else if (r.includes("5y"))
          period1.setFullYear(period1.getFullYear() - 5);
        else if (r.includes("6m") || r.includes("6mo"))
          period1.setMonth(period1.getMonth() - 6);
        else period1.setFullYear(period1.getFullYear() - 1);

        // Check cache first
        const cachedData = await getCachedYahooData(
          ticker,
          period1,
          period2,
          interval as string,
        );
        if (cachedData) {
          // Set cache headers for browser caching
          res.setHeader(
            "Cache-Control",
            `private, max-age=${Math.floor(HISTORY_CACHE_DURATION / 1000)}`,
          );
          return res.json(cachedData);
        }

        const result = await yahooFinance.chart(ticker, {
          period1,
          period2,
          interval: interval as any,
        } as any);

        const points = ((result as any).quotes || [])
          .map((q: any) => ({
            date:
              q.date instanceof Date
                ? q.date.toISOString().slice(0, 10)
                : q.date,
            close: q.close,
          }))
          .filter((p: any) => typeof p.close === "number");

        const responseData = { ticker, range, interval, points };

        // Cache the result
        setCachedYahooData(
          ticker,
          responseData,
          period1,
          period2,
          interval as string,
        );

        // Set cache headers for browser caching
        res.setHeader(
          "Cache-Control",
          `private, max-age=${Math.floor(HISTORY_CACHE_DURATION / 1000)}`,
        );
        res.json(responseData);
      } catch (error) {
        console.error("Error fetching ETF history:", error);
        res.status(500).json({ message: "Failed to fetch ETF history" });
      }
    },
  );

  // Admin endpoint to clear Yahoo Finance cache
  app.post(
    "/api/admin/clear-cache",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const cacheSize = yahooCache.size;
        yahooCache.clear();
        console.log(`Cache cleared. Removed ${cacheSize} entries.`);
        res.json({
          message: "Cache cleared successfully",
          entriesCleared: cacheSize,
        });
      } catch (error) {
        console.error("Error clearing cache:", error);
        res.status(500).json({ message: "Failed to clear cache" });
      }
    },
  );

  app.get(
    "/api/etf/:ticker/info",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const { ticker } = req.params;

        // Check cache first (unless cache-bypass header is set)
        const bypassCache = req.headers["x-bypass-cache"] === "true";
        if (!bypassCache) {
          const cachedData = await getCachedYahooData(ticker);
          if (cachedData) {
            // Set cache headers for browser caching
            res.setHeader(
              "Cache-Control",
              `private, max-age=${Math.floor(INFO_CACHE_DURATION / 1000)}`,
            );
            return res.json(cachedData);
          }
        }

        // Fetch quote, summary, and historical data for accurate annual return
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const [quote, summary, historicalData] = await Promise.all([
          yahooFinance.quote(ticker),
          yahooFinance
            .quoteSummary(ticker, {
              modules: ["summaryDetail", "fundProfile", "defaultKeyStatistics"],
            })
            .catch(() => null), // Don't fail if quoteSummary is unavailable
          yahooFinance
            .historical(ticker, {
              period1: oneYearAgo,
              period2: new Date(),
              interval: "1d",
            })
            .catch(() => null), // Don't fail if historical data is unavailable
        ]);

        // Calculate actual year-over-year return from historical data
        let yearlyReturn = undefined;
        if (
          historicalData &&
          historicalData.length > 0 &&
          quote.regularMarketPrice
        ) {
          // Sort by date to ensure we have oldest first (in case data is reversed)
          const sortedData = [...historicalData].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          );

          const oldestPrice = sortedData[0].close;
          const currentPrice = quote.regularMarketPrice;
          yearlyReturn = (currentPrice - oldestPrice) / oldestPrice;

          // Debug logging for troubleshooting
          if (ticker === "XLC" || Math.abs(yearlyReturn) > 1) {
            console.log(`[${ticker}] Year-over-year calculation:`, {
              oldestDate: sortedData[0].date,
              oldestPrice,
              currentPrice,
              yearlyReturn: (yearlyReturn * 100).toFixed(2) + "%",
              dataPoints: sortedData.length,
            });
          }
        }

        // Combine data from both sources
        const combinedData: any = {
          // Basic quote data
          regularMarketPrice: quote.regularMarketPrice,
          trailingAnnualDividendYield: quote.trailingAnnualDividendYield,
          fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
          fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,

          // Use calculated yearly return from actual historical data
          fiftyTwoWeekChange: yearlyReturn,

          // Add expense ratio from summary if available
          expenseRatio:
            summary?.fundProfile?.feesExpensesInvestment
              ?.annualReportExpenseRatio || undefined,
        };

        // Log what we found
        console.log(`Yahoo Finance data for ${ticker}:`, {
          regularMarketPrice: combinedData.regularMarketPrice,
          expenseRatio: combinedData.expenseRatio,
          trailingAnnualDividendYield: combinedData.trailingAnnualDividendYield,
          fiftyTwoWeekChange: combinedData.fiftyTwoWeekChange,
          historicalDataPoints: historicalData?.length || 0,
        });

        // Cache the result
        setCachedYahooData(ticker, combinedData);

        // Set cache headers for browser caching
        res.setHeader(
          "Cache-Control",
          `private, max-age=${Math.floor(INFO_CACHE_DURATION / 1000)}`,
        );
        res.json(combinedData);
      } catch (error) {
        console.error("Error fetching ETF info:", error);
        res.status(500).json({ message: "Failed to fetch ETF information" });
      }
    },
  );

  // Combined portfolio performance (3y daily, normalized to 100)
  app.get(
    "/api/portfolio/performance",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const userId = (req.user as any).id;
        const portfolio = await storage.getPortfolioByUserId(userId);

        // Default conservative portfolio if no user portfolio exists
        const defaultAllocations = [
          {
            ticker: "BND",
            percentage: 60,
            name: "Vanguard Total Bond Market ETF",
            color: "hsl(var(--chart-3))",
            assetType: "Bonds",
          },
          {
            ticker: "VTI",
            percentage: 25,
            name: "Vanguard Total Stock Market ETF",
            color: "hsl(var(--chart-1))",
            assetType: "US Equity",
          },
          {
            ticker: "VXUS",
            percentage: 10,
            name: "Vanguard Total International Stock ETF",
            color: "hsl(var(--chart-2))",
            assetType: "International Equity",
          },
          {
            ticker: "VNQ",
            percentage: 5,
            name: "Vanguard Real Estate ETF",
            color: "hsl(var(--chart-4))",
            assetType: "REIT",
          },
        ];

        const allocations = portfolio
          ? (portfolio as any).allocations || []
          : defaultAllocations;

        let tickers = allocations
          .filter(
            (a: any) =>
              a &&
              typeof a.percentage === "number" &&
              (a.percentage as number) > 0 &&
              typeof a.ticker === "string",
          )
          .map((a: any) => ({
            ticker: (a.ticker as string).toUpperCase(),
            weight: (a.percentage as number) / 100,
          }));

        // Normalize weights to sum to 1
        const totalWeight = tickers.reduce(
          (sum: number, t: any) => sum + t.weight,
          0,
        );
        if (totalWeight > 0) {
          tickers = tickers.map((t: any) => ({
            ...t,
            weight: t.weight / totalWeight,
          }));
        }

        if (tickers.length === 0) {
          return res.json({ points: [] });
        }

        // Sort by weight (highest first) to prioritize most important tickers
        tickers.sort((a: any, b: any) => b.weight - a.weight);

        // Limit to top 3 tickers to reduce rate limiting issues
        if (tickers.length > 3) {
          console.log(
            `Limiting to top 3 tickers by weight to avoid rate limiting: ${tickers
              .slice(0, 3)
              .map((t: any) => t.ticker)
              .join(", ")}`,
          );
          tickers = tickers.slice(0, 3);

          // Renormalize weights
          const newTotalWeight = tickers.reduce(
            (sum: number, t: any) => sum + t.weight,
            0,
          );
          if (newTotalWeight > 0) {
            tickers = tickers.map((t: any) => ({
              ...t,
              weight: t.weight / newTotalWeight,
            }));
          }
        }

        // Yahoo requires UTC dates; set to midnight UTC for stability
        const now = new Date();
        const period2 = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
        );
        const threeYearsAgo = new Date(period2);
        threeYearsAgo.setUTCFullYear(threeYearsAgo.getUTCFullYear() - 3);
        const period1 = threeYearsAgo;

        // Sequential requests with delays to avoid rate limiting
        const charts = [];
        for (let i = 0; i < tickers.length; i++) {
          const t = tickers[i];

          try {
            // Check cache first
            const cachedData = await getCachedYahooData(
              t.ticker,
              period1,
              period2,
              "1d",
            );
            let chart: any;

            if (cachedData) {
              chart = cachedData;
            } else {
              // Add delay between requests to avoid rate limiting
              if (i > 0) {
                await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
              }

              console.log(
                `Fetching data for ${t.ticker} (${i + 1}/${tickers.length})`,
              );
              chart = await yahooFinance.chart(t.ticker, {
                period1,
                period2,
                interval: "1d",
              } as any);

              // Cache the successful result
              setCachedYahooData(t.ticker, chart, period1, period2, "1d");
            }

            let points: Array<{ date: string; price: number }> = [];

            // Case 1: quotes array with Date objects
            if (
              Array.isArray(chart?.quotes) &&
              chart.quotes.length > 0 &&
              chart.quotes[0]?.date
            ) {
              points = chart.quotes
                .map((q: any) => ({
                  date:
                    q.date instanceof Date
                      ? q.date.toISOString().slice(0, 10)
                      : q.date,
                  price: typeof q.adjclose === "number" ? q.adjclose : q.close,
                }))
                .filter((p: any) => typeof p.price === "number");
            } else if (Array.isArray(chart?.timestamp) && chart?.indicators) {
              // Case 2: timestamp + indicators.quote/adjclose arrays
              const ts: number[] = chart.timestamp;
              const quote = Array.isArray(chart.indicators?.quote)
                ? chart.indicators.quote[0]
                : undefined;
              const adj = Array.isArray(chart.indicators?.adjclose)
                ? chart.indicators.adjclose[0]
                : undefined;

              points = ts
                .map((tSec: number, i: number) => {
                  const close = Array.isArray(quote?.close)
                    ? quote.close[i]
                    : undefined;
                  const adjClose = Array.isArray(adj?.adjclose)
                    ? adj.adjclose[i]
                    : undefined;
                  const price = typeof adjClose === "number" ? adjClose : close;
                  return {
                    date: new Date(tSec * 1000).toISOString().slice(0, 10),
                    price,
                  };
                })
                .filter((p: any) => typeof p.price === "number");
            }

            // Ensure ascending by date
            points.sort((a, b) =>
              a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
            );

            console.log(
              `Successfully fetched ${points.length} data points for ${t.ticker}`,
            );
            charts.push({ ticker: t.ticker, weight: t.weight, points });
          } catch (error: any) {
            console.error(
              `Error fetching chart data for ${t.ticker}:`,
              error.message,
            );

            // Handle rate limiting or other Yahoo Finance errors
            if (
              error.message?.includes("Too Many Requests") ||
              error.message?.includes("429") ||
              error.message?.includes("rate limit") ||
              error.message?.includes("Unexpected token")
            ) {
              console.warn(
                `Rate limit hit for ${t.ticker}, skipping this ticker`,
              );
              charts.push({ ticker: t.ticker, weight: t.weight, points: [] });

              // If we hit rate limit, add extra delay before next request
              if (i < tickers.length - 1) {
                console.log("Adding extra delay due to rate limiting...");
                await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
              }
              continue;
            }

            // For other errors, return empty points
            console.warn(
              `Failed to fetch data for ${t.ticker}, using empty data`,
            );
            charts.push({ ticker: t.ticker, weight: t.weight, points: [] });
          }
        }

        // Check if we have any valid data
        const chartsWithData = charts.filter((c) => c.points.length > 0);
        if (chartsWithData.length === 0) {
          console.warn(
            "No valid chart data available for any tickers - likely due to rate limiting",
          );
          return res.json({
            points: [],
            warning:
              "Market data temporarily unavailable due to service limits. Performance chart will update when data becomes available.",
          });
        }

        // If we have some data but not all, log the success rate
        const successRate = (chartsWithData.length / charts.length) * 100;
        console.log(
          `Successfully fetched data for ${chartsWithData.length}/${charts.length} tickers (${successRate.toFixed(1)}% success rate)`,
        );

        // Determine a common start date where all series have data
        const firstDates = charts
          .map((c) => c.points[0]?.date)
          .filter(Boolean) as string[];
        const startDate =
          firstDates.length === charts.length
            ? firstDates.sort().reverse()[0]
            : undefined; // latest first date across all

        // Build union of dates and filter to >= startDate
        const union = new Set<string>();
        charts.forEach((c) => c.points.forEach((p) => union.add(p.date)));
        let dates = Array.from(union).filter(
          (d) => !startDate || d >= startDate,
        );
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
              if (typeof p === "number") lastPrice[c.ticker] = p;
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
            if (
              typeof prev === "number" &&
              typeof current === "number" &&
              prev > 0
            ) {
              const ratio = current / prev;
              portfolioRatio += c.weight * ratio;
              contributingWeight += c.weight;
              lastPrice[c.ticker] = current;
            } else if (
              typeof current === "number" &&
              typeof prev !== "number"
            ) {
              // Late-starting ticker: seed without affecting today
              lastPrice[c.ticker] = current;
            }
          }

          if (contributingWeight > 0) {
            const normalizedPortfolioRatio =
              portfolioRatio / contributingWeight;
            indexValue = indexValue * normalizedPortfolioRatio;
            points.push({ date, value: +indexValue.toFixed(4) });
          }
        }

        res.json({ points });
      } catch (error) {
        console.error("Error computing portfolio performance:", error);
        res.status(500).json({
          message:
            "Failed to compute portfolio performance. This may be due to temporary market data service limitations. Please try again later.",
          error:
            process.env.NODE_ENV === "development"
              ? (error as Error).message
              : undefined,
        });
      }
    },
  );

  // Portfolio chat routes
  app.get(
    "/api/portfolio/:portfolioId/messages",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const { portfolioId } = req.params;
        const messages = await storage.getPortfolioMessages(portfolioId);
        res.json(messages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Failed to fetch messages" });
      }
    },
  );

  app.delete(
    "/api/portfolio/:portfolioId/messages",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const { portfolioId } = req.params;
        const userId = (req.user as any).id;

        // Verify the portfolio belongs to the user
        const portfolio = await storage.getPortfolioByUserId(userId);
        if (!portfolio || portfolio.id !== portfolioId) {
          return res.status(403).json({
            message: "Unauthorized to delete messages for this portfolio",
          });
        }

        await storage.deletePortfolioMessages(portfolioId);
        res.json({ message: "All messages deleted successfully" });
      } catch (error) {
        console.error("Error deleting messages:", error);
        res.status(500).json({ message: "Failed to delete messages" });
      }
    },
  );

  app.post(
    "/api/portfolio/:portfolioId/messages",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const userId = (req.user as any).id;
        const { portfolioId } = req.params;
        const validatedData = insertPortfolioMessageSchema.parse(req.body);

        const userMessage = await storage.createPortfolioMessage({
          ...validatedData,
          sender: "user",
          userId,
          portfolioId,
        });

        const portfolio = await storage.getPortfolioByUserId(userId);
        if (!portfolio) {
          return res.status(400).json({ message: "Portfolio not found" });
        }

        // Set up SSE headers for streaming
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        // Send user message immediately
        res.write(
          `data: ${JSON.stringify({ type: "userMessage", data: userMessage })}\n\n`,
        );

        // allocations are stored as jsonb; they are already an object
        const allocations = (portfolio as any).allocations;
        const prompt = `You are a financial advisor for Stack16. The user's portfolio has allocations: ${JSON.stringify(allocations)}. Total value: $${portfolio.totalValue}. User asked: ${validatedData.content}. Provide helpful, professional advice.`;

        try {
          const completion = await groqClient.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
              {
                role: "system",
                content:
                  "You are Stack16, a professional AI financial co-pilot. You ONLY answer questions related to the user's portfolio, investments, and financial planning. If a question is not related to finance, investing, or the user's portfolio, politely decline to answer and redirect back to portfolio-related topics. When answering: 1) ground your advice in the provided allocations and totals, 2) explain reasoning and tradeoffs, 3) be conservative with claims, 4) avoid providing individualized investment advice; include a short disclaimer that you are not a licensed advisor.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.5,
            stream: true, // Enable streaming
          });

          let aiResponse = "";

          // Stream the response chunks
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              aiResponse += content;
              res.write(
                `data: ${JSON.stringify({ type: "chunk", data: content })}\n\n`,
              );
            }
          }

          // Save the complete AI response to database
          const aiMessage = await storage.createPortfolioMessage({
            content: aiResponse,
            sender: "ai",
            userId,
            portfolioId,
          });

          // Send completion event with full message
          res.write(
            `data: ${JSON.stringify({ type: "complete", data: aiMessage })}\n\n`,
          );
          res.end();
        } catch (error) {
          console.error("Groq API error:", error);
          res.write(
            `data: ${JSON.stringify({ type: "error", data: { message: "Failed to generate AI response" } })}\n\n`,
          );
          res.end();
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid data", errors: error.errors });
        }
        console.error("Error creating message:", error);
        res.status(500).json({ message: "Failed to create message" });
      }
    },
  );

  const httpServer = createServer(app);
  return httpServer;
}

// Keep the generate functions
function normalizeAllocationsTo100<T extends { percentage: number }>(
  allocs: T[],
): T[] {
  const total = allocs.reduce((sum, a) => sum + (a.percentage || 0), 0);
  if (total === 0) return allocs;
  const scale = 100 / total;
  const withScaled = allocs.map((a) => ({
    item: a,
    raw: (a.percentage || 0) * scale,
  }));
  const floors = withScaled.map(({ item, raw }) => ({
    item,
    floor: Math.floor(raw),
    rem: raw - Math.floor(raw),
  }));
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
    .map(({ item, floor }) => ({ ...item, percentage: floor }) as T);
  return result;
}

function generateEtfAllocationsFromAssessment(assessment: any) {
  const { riskTolerance, geographicFocus, esgExclusions, dividendVsGrowth } =
    assessment;

  // Handle geographicFocus as array or string for backward compatibility
  const geographicFocusArray = Array.isArray(geographicFocus)
    ? geographicFocus
    : [geographicFocus];

  // Baseline ETF sets by risk
  const ETF_SETS: Record<
    string,
    {
      ticker: string;
      name: string;
      percentage: number;
      color: string;
      assetType: string;
    }[]
  > = {
    conservative: [
      {
        ticker: "BND",
        name: "Vanguard Total Bond Market ETF",
        percentage: 60,
        color: "hsl(var(--chart-3))",
        assetType: "Bonds",
      },
      {
        ticker: "VTI",
        name: "Vanguard Total Stock Market ETF",
        percentage: 25,
        color: "hsl(var(--chart-1))",
        assetType: "US Equity",
      },
      {
        ticker: "VXUS",
        name: "Vanguard Total International Stock ETF",
        percentage: 10,
        color: "hsl(var(--chart-2))",
        assetType: "International Equity",
      },
      {
        ticker: "VNQ",
        name: "Vanguard Real Estate ETF",
        percentage: 5,
        color: "hsl(var(--chart-4))",
        assetType: "REIT",
      },
    ],
    moderate: [
      {
        ticker: "VTI",
        name: "Vanguard Total Stock Market ETF",
        percentage: 55,
        color: "hsl(var(--chart-1))",
        assetType: "US Equity",
      },
      {
        ticker: "VXUS",
        name: "Vanguard Total International Stock ETF",
        percentage: 20,
        color: "hsl(var(--chart-2))",
        assetType: "International Equity",
      },
      {
        ticker: "BND",
        name: "Vanguard Total Bond Market ETF",
        percentage: 20,
        color: "hsl(var(--chart-3))",
        assetType: "Bonds",
      },
      {
        ticker: "VNQ",
        name: "Vanguard Real Estate ETF",
        percentage: 5,
        color: "hsl(var(--chart-4))",
        assetType: "REIT",
      },
    ],
    aggressive: [
      {
        ticker: "VTI",
        name: "Vanguard Total Stock Market ETF",
        percentage: 70,
        color: "hsl(var(--chart-1))",
        assetType: "US Equity",
      },
      {
        ticker: "VXUS",
        name: "Vanguard Total International Stock ETF",
        percentage: 20,
        color: "hsl(var(--chart-2))",
        assetType: "International Equity",
      },
      {
        ticker: "QQQ",
        name: "Invesco QQQ Trust",
        percentage: 10,
        color: "hsl(var(--chart-5))",
        assetType: "US Growth",
      },
    ],
  };

  let allocations = ETF_SETS[riskTolerance] || ETF_SETS["moderate"];

  // Apply dividend vs growth adjustments
  if (dividendVsGrowth === "dividend-focus") {
    // Replace some growth-oriented ETFs with dividend-focused ones
    allocations = allocations.map((a) => {
      if (a.ticker === "VTI")
        return {
          ...a,
          ticker: "VIG",
          name: "Vanguard Dividend Appreciation ETF",
          assetType: "US Dividend Equity",
        };
      if (a.ticker === "VXUS")
        return {
          ...a,
          ticker: "VYMI",
          name: "Vanguard International High Dividend Yield ETF",
          assetType: "International Dividend Equity",
        };
      if (a.ticker === "QQQ")
        return {
          ...a,
          ticker: "VIG",
          name: "Vanguard Dividend Appreciation ETF",
          assetType: "US Dividend Equity",
        };
      return a;
    });
  } else if (dividendVsGrowth === "growth-focus") {
    // Emphasize growth-oriented ETFs
    allocations = allocations.map((a) => {
      if (
        a.ticker === "VTI" &&
        allocations.some((alloc) => alloc.ticker === "QQQ")
      ) {
        // If QQQ is already present, keep the balance but ensure growth focus
        return a;
      }
      if (a.ticker === "VXUS")
        return {
          ...a,
          ticker: "VWO",
          name: "Vanguard FTSE Emerging Markets ETF",
          assetType: "Emerging Markets Equity",
        };
      return a;
    });
  }
  // For 'balanced', keep the original allocations

  // Apply ESG transformations based on exclusions
  // If user excludes non-ESG funds, use ESG-focused alternatives
  const esgExclusionsArray = Array.isArray(esgExclusions) ? esgExclusions : [];
  const excludeNonEsgFunds = esgExclusionsArray.includes("non-esg-funds");

  if (excludeNonEsgFunds) {
    allocations = allocations.map((a) => {
      if (a.ticker === "VTI")
        return {
          ...a,
          ticker: "ESGV",
          name: "Vanguard ESG U.S. Stock ETF",
          assetType: "US Equity",
        };
      if (a.ticker === "VIG")
        return {
          ...a,
          ticker: "ESGD",
          name: "iShares ESG Aware MSCI EAFE ETF",
          assetType: "International Equity",
        };
      if (a.ticker === "VXUS")
        return {
          ...a,
          ticker: "ESGD",
          name: "iShares ESG Aware MSCI EAFE ETF",
          assetType: "International Equity",
        };
      if (a.ticker === "BND")
        return {
          ...a,
          ticker: "SUSB",
          name: "iShares ESG Aware USD Corporate Bond ETF",
          assetType: "Bonds",
        };
      return a;
    });
  }

  // Apply geographic focus filtering
  // If only US is selected, remove international exposure
  if (
    geographicFocusArray.length === 1 &&
    geographicFocusArray.includes("united-states")
  ) {
    const removedWeight = allocations
      .filter(
        (a) =>
          a.ticker === "VXUS" ||
          a.ticker === "ESGD" ||
          a.ticker === "VYMI" ||
          a.ticker === "VWO",
      )
      .reduce((sum, a) => sum + a.percentage, 0);
    allocations = allocations
      .filter(
        (a) =>
          a.ticker !== "VXUS" &&
          a.ticker !== "ESGD" &&
          a.ticker !== "VYMI" &&
          a.ticker !== "VWO",
      )
      .map((a) => ({ ...a }));
    const usPosition =
      allocations.find(
        (a) => a.ticker === "VTI" || a.ticker === "ESGV" || a.ticker === "VIG",
      ) || allocations.find((a) => a.ticker === "QQQ");
    if (usPosition) usPosition.percentage += removedWeight;
  }
  // For now, if multiple regions or non-US regions are selected, keep the global allocation
  // Future enhancement: adjust allocations based on specific regional preferences

  // Ensure total equals 100%
  return normalizeAllocationsTo100(allocations);
}
