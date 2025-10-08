/**
 * Legacy storage interface for backwards compatibility
 * This file re-exports repository methods using the old interface
 * 
 * @deprecated Use repositories directly instead
 */
import {
  userRepository,
  assessmentRepository,
  portfolioRepository,
  messageRepository,
} from './repositories';
import type { IStorage } from './storage';

/**
 * Legacy storage implementation using new repositories
 * @deprecated Use repositories directly
 */
class LegacyStorageAdapter implements IStorage {
  // Delegate all methods to the new repositories
  getUser = userRepository.getUser.bind(userRepository);
  upsertUser = userRepository.upsertUser.bind(userRepository);
  getUserByEmail = userRepository.getUserByEmail.bind(userRepository);
  createUser = userRepository.createUser.bind(userRepository);
  
  createRiskAssessment = assessmentRepository.createRiskAssessment.bind(assessmentRepository);
  getRiskAssessmentByUserId = assessmentRepository.getRiskAssessmentByUserId.bind(assessmentRepository);
  
  createPortfolioRecommendation = portfolioRepository.createPortfolioRecommendation.bind(portfolioRepository);
  getPortfolioByUserId = portfolioRepository.getPortfolioByUserId.bind(portfolioRepository);
  updatePortfolioValue = portfolioRepository.updatePortfolioValue.bind(portfolioRepository);
  
  createPortfolioMessage = messageRepository.createPortfolioMessage.bind(messageRepository);
  getPortfolioMessages = messageRepository.getPortfolioMessages.bind(messageRepository);
  deletePortfolioMessages = messageRepository.deletePortfolioMessages.bind(messageRepository);
  
  // Auth token methods (still in userRepository for now)
  createAuthToken = async (token: any) => {
    // Auth tokens not moved to repository yet - implement if needed
    throw new Error('Auth tokens not yet migrated to repositories');
  };
  getAuthTokenByToken = async (token: string) => {
    throw new Error('Auth tokens not yet migrated to repositories');
  };
  markTokenAsUsed = async (tokenId: string) => {
    throw new Error('Auth tokens not yet migrated to repositories');
  };
  deleteExpiredTokens = async () => {
    throw new Error('Auth tokens not yet migrated to repositories');
  };
  
  createPasswordResetToken = userRepository.createPasswordResetToken.bind(userRepository);
  getPasswordResetToken = userRepository.getPasswordResetToken.bind(userRepository);
  markPasswordResetTokenAsUsed = userRepository.markPasswordResetTokenAsUsed.bind(userRepository);
  deleteExpiredPasswordResetTokens = userRepository.deleteExpiredPasswordResetTokens.bind(userRepository);
  updateUserPassword = userRepository.updateUserPassword.bind(userRepository);
  updateUserLastLogin = userRepository.updateUserLastLogin.bind(userRepository);
  
  createEmailChangeToken = userRepository.createEmailChangeToken.bind(userRepository);
  getEmailChangeTokenByToken = userRepository.getEmailChangeTokenByToken.bind(userRepository);
  markEmailChangeTokenAsUsed = userRepository.markEmailChangeTokenAsUsed.bind(userRepository);
  deleteExpiredEmailChangeTokens = userRepository.deleteExpiredEmailChangeTokens.bind(userRepository);
  updateUserEmail = userRepository.updateUserEmail.bind(userRepository);
  
  deleteUserData = userRepository.deleteUserData.bind(userRepository);
  getRiskAssessmentsByUserId = assessmentRepository.getRiskAssessmentsByUserId.bind(assessmentRepository);
  getPortfolioRecommendationsByUserId = portfolioRepository.getPortfolioRecommendationsByUserId.bind(portfolioRepository);
  getPortfolioMessagesByUserId = messageRepository.getPortfolioMessagesByUserId.bind(messageRepository);
}

/**
 * @deprecated Use repositories directly from './repositories'
 */
export const storage = new LegacyStorageAdapter();

