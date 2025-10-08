/**
 * Central export for all repository classes
 */
export { UserRepository } from './user.repository';
export { AssessmentRepository } from './assessment.repository';
export { PortfolioRepository, MessageRepository } from './portfolio.repository';

// Create singleton instances for convenience
import { UserRepository } from './user.repository';
import { AssessmentRepository } from './assessment.repository';
import { PortfolioRepository, MessageRepository } from './portfolio.repository';

export const userRepository = new UserRepository();
export const assessmentRepository = new AssessmentRepository();
export const portfolioRepository = new PortfolioRepository();
export const messageRepository = new MessageRepository();

