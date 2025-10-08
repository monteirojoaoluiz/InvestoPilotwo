/**
 * Investment product abstraction layer
 * This provides a uniform interface for different investment products (ETFs, Bonds, Crypto, etc.)
 */

/**
 * Base interface for all investment products
 */
export interface InvestmentProduct {
  type: 'etf' | 'bond' | 'crypto' | 'commodity' | 'stock';
  ticker: string;
  name: string;
  category: string;
  
  /**
   * Get current market data for this product
   */
  getMarketData(): Promise<ProductMarketData>;
  
  /**
   * Get historical performance data
   */
  getPerformance(period: PerformancePeriod): Promise<PerformanceData>;
  
  /**
   * Check if product matches investment criteria
   */
  matchesCriteria(criteria: InvestmentCriteria): boolean;
}

/**
 * Market data structure
 */
export interface ProductMarketData {
  currentPrice: number;
  currency: string;
  lastUpdated: Date;
  volume?: number;
  marketCap?: number;
  dividendYield?: number;
  expenseRatio?: number;
}

/**
 * Performance data structure
 */
export interface PerformanceData {
  period: PerformancePeriod;
  returns: {
    date: string;
    value: number;
  }[];
  totalReturn: number; // Percentage
  volatility: number; // Percentage
  sharpeRatio?: number;
}

/**
 * Performance period options
 */
export type PerformancePeriod = '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'YTD';

/**
 * Investment criteria for filtering
 */
export interface InvestmentCriteria {
  geographicFocus?: string[];
  excludeIndustries?: string[];
  esgRequired?: boolean;
  minLiquidity?: number;
  maxExpenseRatio?: number;
  dividendFocused?: boolean;
  growthFocused?: boolean;
}

/**
 * Product registry for managing available investment products
 */
export class ProductRegistry {
  private products: Map<string, InvestmentProduct> = new Map();

  /**
   * Register a new product type
   */
  registerProduct(product: InvestmentProduct): void {
    const key = `${product.type}:${product.ticker}`;
    this.products.set(key, product);
  }

  /**
   * Get product by type and ticker
   */
  getProduct(type: string, ticker: string): InvestmentProduct | undefined {
    return this.products.get(`${type}:${ticker}`);
  }

  /**
   * Search products by criteria
   */
  searchProducts(criteria: InvestmentCriteria): InvestmentProduct[] {
    return Array.from(this.products.values()).filter(product =>
      product.matchesCriteria(criteria)
    );
  }

  /**
   * Get all products of a specific type
   */
  getProductsByType(type: InvestmentProduct['type']): InvestmentProduct[] {
    return Array.from(this.products.values()).filter(p => p.type === type);
  }

  /**
   * Get all registered products
   */
  getAllProducts(): InvestmentProduct[] {
    return Array.from(this.products.values());
  }
}

// Export singleton instance
export const productRegistry = new ProductRegistry();

