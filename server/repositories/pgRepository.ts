// PG repository adapter - wraps existing storage instance to provide a DI-friendly repository
import { IStorage, storage as dbStorage } from '../storage';

export class PgRepository implements IStorage {
  // User operations
  getUser(id: string) {
    return dbStorage.getUser(id);
  }
  upsertUser(user: any) {
    return dbStorage.upsertUser(user);
  }
  getUserByEmail(email: string) {
    return dbStorage.getUserByEmail(email);
  }
  createUser(user: any) {
    return dbStorage.createUser(user);
  }

  // Risk assessment operations
  createRiskAssessment(assessment: any) {
    return dbStorage.createRiskAssessment(assessment);
  }
  getRiskAssessmentByUserId(userId: string) {
    return dbStorage.getRiskAssessmentByUserId(userId);
  }

  // Portfolio operations
  createPortfolioRecommendation(portfolio: any) {
    return dbStorage.createPortfolioRecommendation(portfolio);
  }
  getPortfolioByUserId(userId: string) {
    return dbStorage.getPortfolioByUserId(userId);
  }
  updatePortfolioValue(portfolioId: string, totalValue: number, totalReturn: number) {
    return dbStorage.updatePortfolioValue(portfolioId, totalValue, totalReturn);
  }

  // Chat operations
  createPortfolioMessage(message: any) {
    return dbStorage.createPortfolioMessage(message);
  }
  getPortfolioMessages(portfolioId: string) {
    return dbStorage.getPortfolioMessages(portfolioId);
  }
  deletePortfolioMessages(portfolioId: string) {
    return dbStorage.deletePortfolioMessages(portfolioId);
  }

  createAuthToken(token: any) {
    return dbStorage.createAuthToken(token);
  }
  getAuthTokenByToken(token: string) {
    return dbStorage.getAuthTokenByToken(token);
  }
  markTokenAsUsed(tokenId: string) {
    return dbStorage.markTokenAsUsed(tokenId);
  }
  deleteExpiredTokens() {
    return dbStorage.deleteExpiredTokens();
  }

  // Password reset operations
  createPasswordResetToken(token: any) {
    return dbStorage.createPasswordResetToken(token);
  }
  getPasswordResetToken(token: string) {
    return dbStorage.getPasswordResetToken(token);
  }
  markPasswordResetTokenAsUsed(tokenId: string) {
    return dbStorage.markPasswordResetTokenAsUsed(tokenId);
  }
  deleteExpiredPasswordResetTokens() {
    return dbStorage.deleteExpiredPasswordResetTokens();
  }
  updateUserPassword(userId: string, hashedPassword: string) {
    return dbStorage.updateUserPassword(userId, hashedPassword);
  }
  updateUserLastLogin(userId: string) {
    return dbStorage.updateUserLastLogin(userId);
  }

  // Email change
  createEmailChangeToken(token: any) {
    return dbStorage.createEmailChangeToken(token);
  }
  getEmailChangeTokenByToken(token: string) {
    return dbStorage.getEmailChangeTokenByToken(token);
  }
  markEmailChangeTokenAsUsed(tokenId: string) {
    return dbStorage.markEmailChangeTokenAsUsed(tokenId);
  }
  deleteExpiredEmailChangeTokens() {
    return dbStorage.deleteExpiredEmailChangeTokens();
  }
  updateUserEmail(userId: string, email: string) {
    return dbStorage.updateUserEmail(userId, email);
  }

  // User deletion & exports
  deleteUserData(userId: string) {
    return dbStorage.deleteUserData(userId);
  }
  getRiskAssessmentsByUserId(userId: string) {
    return dbStorage.getRiskAssessmentsByUserId(userId);
  }
  getPortfolioRecommendationsByUserId(userId: string) {
    return dbStorage.getPortfolioRecommendationsByUserId(userId);
  }
  getPortfolioMessagesByUserId(userId: string) {
    return dbStorage.getPortfolioMessagesByUserId(userId);
  }
}

export default PgRepository;
