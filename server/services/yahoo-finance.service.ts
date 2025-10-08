import yahooFinance from 'yahoo-finance2';
import { logger } from '../logger';

/**
 * Cache entry structure
 */
interface CacheEntry {
  data: any;
  timestamp: number;
}

/**
 * Service for fetching and caching Yahoo Finance data
 */
export class YahooFinanceService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly HISTORY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly INFO_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  constructor() {
    // Start cache cleanup interval
    this.startCacheCleanup();
  }

  /**
   * Get cached data if available and not expired
   */
  private getCachedData(cacheKey: string, duration: number): any | null {
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < duration) {
      logger.info(`Cache hit for ${cacheKey}`);
      return cached.data;
    }
    
    return null;
  }

  /**
   * Set cache data
   */
  private setCacheData(cacheKey: string, data: any): void {
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    // Log cache size periodically
    if (this.cache.size % 50 === 0) {
      logger.info(`Yahoo Finance cache size: ${this.cache.size} entries`);
    }
  }

  /**
   * Generate cache key for historical data
   */
  private getHistoryCacheKey(ticker: string, period1: Date, period2: Date, interval: string): string {
    return `hist-${ticker}-${period1.getTime()}-${period2.getTime()}-${interval}`;
  }

  /**
   * Generate cache key for info data
   */
  private getInfoCacheKey(ticker: string): string {
    return `info-${ticker}`;
  }

  /**
   * Fetch historical chart data with caching
   */
  async getChartData(ticker: string, period1: Date, period2: Date, interval: string): Promise<any> {
    const cacheKey = this.getHistoryCacheKey(ticker, period1, period2, interval);
    const cachedData = this.getCachedData(cacheKey, this.HISTORY_CACHE_DURATION);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      const chart = await yahooFinance.chart(ticker, {
        period1,
        period2,
        interval: interval as any,
      } as any);

      this.setCacheData(cacheKey, chart);
      return chart;
    } catch (error: any) {
      logger.error(`Error fetching chart data for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Fetch ETF quote information with caching
   */
  async getQuote(ticker: string): Promise<any> {
    const cacheKey = this.getInfoCacheKey(ticker);
    const cachedData = this.getCachedData(cacheKey, this.INFO_CACHE_DURATION);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      const quote = await yahooFinance.quote(ticker);
      this.setCacheData(cacheKey, quote);
      return quote;
    } catch (error: any) {
      logger.error(`Error fetching quote for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Fetch quote summary with caching
   */
  async getQuoteSummary(ticker: string, modules: string[]): Promise<any> {
    const cacheKey = `${this.getInfoCacheKey(ticker)}-summary`;
    const cachedData = this.getCachedData(cacheKey, this.INFO_CACHE_DURATION);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      const summary = await yahooFinance.quoteSummary(ticker, { 
        modules: modules as any
      });
      this.setCacheData(cacheKey, summary);
      return summary;
    } catch (error: any) {
      logger.warn(`Quote summary not available for ${ticker}`);
      return null;
    }
  }

  /**
   * Fetch historical price data
   */
  async getHistoricalData(ticker: string, period1: Date, period2: Date): Promise<any> {
    try {
      const data = await yahooFinance.historical(ticker, {
        period1,
        period2,
        interval: '1d'
      });
      return data;
    } catch (error: any) {
      logger.warn(`Historical data not available for ${ticker}`);
      return null;
    }
  }

  /**
   * Clear entire cache
   */
  clearCache(): number {
    const size = this.cache.size;
    this.cache.clear();
    logger.info(`Cache cleared. Removed ${size} entries.`);
    return size;
  }

  /**
   * Start periodic cache cleanup
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      let deletedCount = 0;
      
      for (const [key, value] of Array.from(this.cache.entries())) {
        const isHistory = key.startsWith('hist-');
        const duration = isHistory ? this.HISTORY_CACHE_DURATION : this.INFO_CACHE_DURATION;
        
        // Keep for 2x cache duration before cleanup
        if (now - value.timestamp > duration * 2) {
          this.cache.delete(key);
          deletedCount++;
        }
      }
      
      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} expired cache entries. Current size: ${this.cache.size}`);
      }
    }, 15 * 60 * 1000); // Run cleanup every 15 minutes
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const yahooFinanceService = new YahooFinanceService();

