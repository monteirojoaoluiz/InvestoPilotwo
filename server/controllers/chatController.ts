import { Request, Response } from 'express';
import { resolve } from '../di/container';
import { insertPortfolioMessageSchema } from '@shared/schema';
import { z } from 'zod';
import { Groq } from 'groq-sdk';
import { config } from '../config';

const groqClient = new Groq({ apiKey: config.GROQ_API_KEY! });

export async function getMessages(req: Request, res: Response) {
  try {
    const { portfolioId } = req.params;
    const storage = resolve<any>('Storage');
    const messages = await storage.getPortfolioMessages(portfolioId);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
}

export async function deleteMessages(req: Request, res: Response) {
  try {
    const { portfolioId } = req.params;
    const userId = (req.user as any).id;
    const storage = resolve<any>('Storage');

    // Verify ownership
    const portfolio = await storage.getPortfolioByUserId(userId);
    if (!portfolio || portfolio.id !== portfolioId) {
      return res.status(403).json({ message: 'Unauthorized to delete messages for this portfolio' });
    }

    await storage.deletePortfolioMessages(portfolioId);
    res.json({ message: 'All messages deleted successfully' });
  } catch (error) {
    console.error('Error deleting messages:', error);
    res.status(500).json({ message: 'Failed to delete messages' });
  }
}

export async function postMessage(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id;
    const { portfolioId } = req.params as any;
    const storage = resolve<any>('Storage');

    const validatedData = insertPortfolioMessageSchema.parse(req.body);

    // Save user message
    const userMessage = await storage.createPortfolioMessage({ ...validatedData, sender: 'user', userId, portfolioId });

    const portfolio = await storage.getPortfolioByUserId(userId);
    if (!portfolio) return res.status(400).json({ message: 'Portfolio not found' });

    // SSE setup
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.write(`data: ${JSON.stringify({ type: 'userMessage', data: userMessage })}\n\n`);

    const allocations = (portfolio as any).allocations;

    const prompt = `You are a financial advisor for Stack16. The user's portfolio has allocations: ${JSON.stringify(allocations)}. Total value: $${portfolio.totalValue}. User asked: ${validatedData.content}. Provide helpful, professional advice.`;

    try {
      const completion = await groqClient.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: 'You are Stack16, a professional AI financial co-pilot...' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        stream: true,
      });

      let aiResponse = '';
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          aiResponse += content;
          res.write(`data: ${JSON.stringify({ type: 'chunk', data: content })}\n\n`);
        }
      }

      const aiMessage = await storage.createPortfolioMessage({ content: aiResponse, sender: 'ai', userId, portfolioId });
      res.write(`data: ${JSON.stringify({ type: 'complete', data: aiMessage })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Groq API error:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', data: { message: 'Failed to generate AI response' } })}\n\n`);
      res.end();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid data', errors: error.errors });
    }
    console.error('Error creating message:', error);
    res.status(500).json({ message: 'Failed to create message' });
  }
}
