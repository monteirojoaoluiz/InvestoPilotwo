import { Router, type Request, Response } from 'express';
import { z } from 'zod';
import { portfolioRepository, messageRepository } from '../repositories';
import { groqService } from '../services';
import { isAuthenticated } from '../middleware/auth.middleware';
import { insertPortfolioMessageSchema } from '@shared/schema';
import { logger } from '../logger';

const router = Router();

/**
 * GET /api/portfolio/:portfolioId/messages
 * Get all chat messages for a portfolio
 */
router.get('/:portfolioId/messages', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { portfolioId } = req.params;
    const messages = await messageRepository.getPortfolioMessages(portfolioId);
    res.json(messages);
  } catch (error) {
    logger.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

/**
 * DELETE /api/portfolio/:portfolioId/messages
 * Delete all messages for a portfolio
 */
router.delete('/:portfolioId/messages', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { portfolioId } = req.params;
    const userId = (req.user as any).id;

    // Verify the portfolio belongs to the user
    const portfolio = await portfolioRepository.getPortfolioByUserId(userId);
    if (!portfolio || portfolio.id !== portfolioId) {
      return res.status(403).json({ message: "Unauthorized to delete messages for this portfolio" });
    }

    await messageRepository.deletePortfolioMessages(portfolioId);
    res.json({ message: "All messages deleted successfully" });
  } catch (error) {
    logger.error("Error deleting messages:", error);
    res.status(500).json({ message: "Failed to delete messages" });
  }
});

/**
 * POST /api/portfolio/:portfolioId/messages
 * Create a new chat message and get AI response (streaming)
 */
router.post('/:portfolioId/messages', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { portfolioId } = req.params;
    const validatedData = insertPortfolioMessageSchema.parse(req.body);
    
    // Create user message
    const userMessage = await messageRepository.createPortfolioMessage({
      ...validatedData,
      sender: 'user',
      userId,
      portfolioId,
    });

    // Get portfolio data
    const portfolio = await portfolioRepository.getPortfolioByUserId(userId);
    if (!portfolio) {
      return res.status(400).json({ message: 'Portfolio not found' });
    }

    // Check if Groq service is available
    if (!groqService) {
      return res.status(503).json({ message: 'AI chat service is not configured' });
    }

    // Set up SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send user message immediately
    res.write(`data: ${JSON.stringify({ type: 'userMessage', data: userMessage })}\n\n`);

    try {
      let aiResponse = '';
      
      // Stream the AI response
      const portfolioData = {
        allocations: (portfolio as any).allocations,
        totalValue: portfolio.totalValue,
      };

      for await (const chunk of groqService.streamPortfolioAdvice(portfolioData, validatedData.content)) {
        aiResponse += chunk;
        res.write(`data: ${JSON.stringify({ type: 'chunk', data: chunk })}\n\n`);
      }
      
      // Save the complete AI response to database
      const aiMessage = await messageRepository.createPortfolioMessage({
        content: aiResponse,
        sender: 'ai',
        userId,
        portfolioId,
      });
      
      // Send completion event with full message
      res.write(`data: ${JSON.stringify({ type: 'complete', data: aiMessage })}\n\n`);
      res.end();
    } catch (error) {
      logger.error('Groq API error:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', data: { message: 'Failed to generate AI response' } })}\n\n`);
      res.end();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    logger.error("Error creating message:", error);
    res.status(500).json({ message: "Failed to create message" });
  }
});

export default router;

