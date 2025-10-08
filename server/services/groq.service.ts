import { Groq } from 'groq-sdk';
import { logger } from '../logger';

/**
 * Service for Groq AI chat completions
 */
export class GroqService {
  private client: Groq;

  constructor(apiKey: string) {
    this.client = new Groq({ apiKey });
  }

  /**
   * Generate streaming chat completion for portfolio advice
   */
  async *streamPortfolioAdvice(
    portfolioData: { allocations: any[]; totalValue: number },
    userMessage: string
  ): AsyncGenerator<string, void, unknown> {
    const prompt = `You are a financial advisor for Stack16. The user's portfolio has allocations: ${JSON.stringify(portfolioData.allocations)}. Total value: $${portfolioData.totalValue}. User asked: ${userMessage}. Provide helpful, professional advice.`;

    const systemPrompt = `You are Stack16, a professional AI financial co-pilot. You ONLY answer questions related to the user's portfolio, investments, and financial planning. If a question is not related to finance, investing, or the user's portfolio, politely decline to answer and redirect back to portfolio-related topics. When answering: 1) ground your advice in the provided allocations and totals, 2) explain reasoning and tradeoffs, 3) be conservative with claims, 4) avoid providing individualized investment advice; include a short disclaimer that you are not a licensed advisor.`;

    try {
      const completion = await this.client.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        stream: true,
      });

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield content;
        }
      }
    } catch (error: any) {
      logger.error('Groq API error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Generate non-streaming chat completion
   */
  async generateChatCompletion(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0.5
  ): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature,
        stream: false,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error: any) {
      logger.error('Groq API error:', error);
      throw new Error('Failed to generate AI response');
    }
  }
}

// Export factory function to create service with API key
export function createGroqService(): GroqService | null {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    logger.warn('GROQ_API_KEY not set. AI chat features will be disabled.');
    return null;
  }

  return new GroqService(apiKey);
}

// Export singleton instance (may be null if API key not set)
export const groqService = createGroqService();

