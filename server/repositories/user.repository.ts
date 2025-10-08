import {
  users,
  authTokens,
  passwordResetTokens,
  emailChangeTokens,
  type User,
  type UpsertUser,
  type InsertPasswordResetToken,
  type PasswordResetToken,
  type InsertEmailChangeToken,
  type EmailChangeToken,
} from "@shared/schema";
import { db } from "../db";
import { eq, and, lt, sql, isNull } from "drizzle-orm";

/**
 * Repository for user-related database operations
 */
export class UserRepository {
  /**
   * Get user by ID (excludes soft-deleted users)
   */
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)));
    return user;
  }

  /**
   * Get user by email (excludes soft-deleted users)
   */
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)));
    return user;
  }

  /**
   * Create a new user
   */
  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  /**
   * Upsert user (insert or update on conflict)
   */
  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  /**
   * Update user password
   */
  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  /**
   * Update user email
   */
  async updateUserEmail(userId: string, email: string): Promise<void> {
    await db
      .update(users)
      .set({
        email,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  /**
   * Update user last login timestamp
   */
  async updateUserLastLogin(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        lastLogin: new Date(),
      })
      .where(eq(users.id, userId));
  }

  /**
   * Soft delete user and cascade delete related data
   */
  async deleteUserData(userId: string): Promise<void> {
    // Soft delete user
    await db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, userId));

    // Hard delete related tokens and auth data
    await db
      .delete(authTokens)
      .where(eq(authTokens.email, sql`(SELECT email FROM users WHERE id = ${userId})`));
    
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, userId));
    
    await db
      .delete(emailChangeTokens)
      .where(eq(emailChangeTokens.userId, userId));
  }

  /**
   * Hard delete users that have been soft-deleted for more than 30 days
   */
  async hardDeleteOldUsers(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(lt(users.deletedAt!, thirtyDaysAgo));

    for (const user of oldUsers) {
      await this.deleteUserData(user.id);
      await db.delete(users).where(eq(users.id, user.id));
    }
  }

  /**
   * Create password reset token
   */
  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [newToken] = await db
      .insert(passwordResetTokens)
      .values(token)
      .returning();
    return newToken;
  }

  /**
   * Get password reset token by token string
   */
  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [tokenData] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return tokenData;
  }

  /**
   * Mark password reset token as used
   */
  async markPasswordResetTokenAsUsed(tokenId: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, tokenId));
  }

  /**
   * Delete expired password reset tokens
   */
  async deleteExpiredPasswordResetTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(
        and(
          lt(passwordResetTokens.expiresAt, sql`NOW()`),
          eq(passwordResetTokens.used, false)
        )
      );
  }

  /**
   * Create email change token
   */
  async createEmailChangeToken(token: InsertEmailChangeToken): Promise<EmailChangeToken> {
    const [newToken] = await db
      .insert(emailChangeTokens)
      .values(token)
      .returning();
    return newToken;
  }

  /**
   * Get email change token by token string
   */
  async getEmailChangeTokenByToken(token: string): Promise<EmailChangeToken | undefined> {
    const [tokenData] = await db
      .select()
      .from(emailChangeTokens)
      .where(eq(emailChangeTokens.token, token));
    return tokenData;
  }

  /**
   * Mark email change token as used
   */
  async markEmailChangeTokenAsUsed(tokenId: string): Promise<void> {
    await db
      .update(emailChangeTokens)
      .set({ used: true })
      .where(eq(emailChangeTokens.id, tokenId));
  }

  /**
   * Delete expired email change tokens
   */
  async deleteExpiredEmailChangeTokens(): Promise<void> {
    await db
      .delete(emailChangeTokens)
      .where(
        and(
          lt(emailChangeTokens.expiresAt, sql`NOW()`),
          eq(emailChangeTokens.used, false)
        )
      );
  }
}

