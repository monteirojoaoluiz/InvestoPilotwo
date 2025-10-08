import { Router, type Request, Response } from 'express';
import { portfolioRepository } from '../repositories';
import { yahooFinanceService } from '../services';
import { isAuthenticated } from '../middleware/auth.middleware';
import { logger } from '../logger';

const router = Router();

/**
 * GET /api/etf/:ticker/history
 * Get historical price data for an ETF
 */
router.get('/:ticker/history', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { ticker } = req.params;
    const { range = '1y', interval = '1wk' } = req.query as { range?: string; interval?: string };

    const now = new Date();
    const period2 = now;
    const period1 = new Date(now);
    
    // Parse range parameter
    const r = (range || '1y').toLowerCase();
    if (r.includes('3y')) period1.setFullYear(period1.getFullYear() - 3);
    else if (r.includes('5y')) period1.setFullYear(period1.getFullYear() - 5);
    else if (r.includes('6m') || r.includes('6mo')) period1.setMonth(period1.getMonth() - 6);
    else period1.setFullYear(period1.getFullYear() - 1);

    // Fetch chart data (with caching)
    const result = await yahooFinanceService.getChartData(ticker, period1, period2, interval);

    const points = ((result as any).quotes || []).map((q: any) => ({
      date: q.date instanceof Date ? q.date.toISOString().slice(0, 10) : q.date,
      close: q.close,
    })).filter((p: any) => typeof p.close === 'number');

    const responseData = { ticker, range, interval, points };
    
    // Set cache headers for browser caching
    res.setHeader('Cache-Control', 'private, max-age=300'); // 5 minutes
    res.json(responseData);
  } catch (error) {
    logger.error('Error fetching ETF history:', error);
    res.status(500).json({ message: 'Failed to fetch ETF history' });
  }
});

/**
 * GET /api/etf/:ticker/info
 * Get detailed information about an ETF
 */
router.get('/:ticker/info', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { ticker } = req.params;
    
    // Fetch data from Yahoo Finance
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const [quote, summary, historicalData] = await Promise.all([
      yahooFinanceService.getQuote(ticker),
      yahooFinanceService.getQuoteSummary(ticker, ['summaryDetail', 'fundProfile', 'defaultKeyStatistics']),
      yahooFinanceService.getHistoricalData(ticker, oneYearAgo, new Date()),
    ]);
    
    // Calculate actual year-over-year return from historical data
    let yearlyReturn = undefined;
    if (historicalData && historicalData.length > 0 && quote.regularMarketPrice) {
      const sortedData = [...historicalData].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      const oldestPrice = sortedData[0].close;
      const currentPrice = quote.regularMarketPrice;
      yearlyReturn = ((currentPrice - oldestPrice) / oldestPrice);
    }
    
    // Combine data from both sources
    const combinedData: any = {
      regularMarketPrice: quote.regularMarketPrice,
      trailingAnnualDividendYield: quote.trailingAnnualDividendYield,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
      fiftyTwoWeekChange: yearlyReturn,
      expenseRatio: summary?.fundProfile?.feesExpensesInvestment?.annualReportExpenseRatio || undefined,
    };
    
    // Set cache headers
    res.setHeader('Cache-Control', 'private, max-age=600'); // 10 minutes
    res.json(combinedData);
  } catch (error) {
    logger.error('Error fetching ETF info:', error);
    res.status(500).json({ message: 'Failed to fetch ETF information' });
  }
});

/**
 * GET /api/portfolio/performance
 * Get combined portfolio performance (3-year daily, normalized to 100)
 */
router.get('/portfolio/performance', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const portfolio = await portfolioRepository.getPortfolioByUserId(userId);

    // Default conservative portfolio if no user portfolio exists
    const defaultAllocations = [
      { ticker: 'BND', percentage: 60, name: 'Vanguard Total Bond Market ETF', color: 'hsl(var(--chart-3))', assetType: 'Bonds' },
      { ticker: 'VTI', percentage: 25, name: 'Vanguard Total Stock Market ETF', color: 'hsl(var(--chart-1))', assetType: 'US Equity' },
      { ticker: 'VXUS', percentage: 10, name: 'Vanguard Total International Stock ETF', color: 'hsl(var(--chart-2))', assetType: 'International Equity' },
      { ticker: 'VNQ', percentage: 5, name: 'Vanguard Real Estate ETF', color: 'hsl(var(--chart-4))', assetType: 'REIT' },
    ];

    const allocations = portfolio ? (portfolio as any).allocations || [] : defaultAllocations;

    let tickers = allocations
      .filter((a: any) => a && typeof a.percentage === 'number' && (a.percentage as number) > 0 && typeof a.ticker === 'string')
      .map((a: any) => ({ ticker: (a.ticker as string).toUpperCase(), weight: (a.percentage as number) / 100 }));

    // Normalize weights to sum to 1
    const totalWeight = tickers.reduce((sum: number, t: any) => sum + t.weight, 0);
    if (totalWeight > 0) {
      tickers = tickers.map((t: any) => ({ ...t, weight: t.weight / totalWeight }));
    }

    if (tickers.length === 0) {
      return res.json({ points: [] });
    }

    // Sort by weight and limit to top 3 tickers to reduce rate limiting issues
    tickers.sort((a: any, b: any) => b.weight - a.weight);
    
    if (tickers.length > 3) {
      logger.info(`Limiting to top 3 tickers by weight: ${tickers.slice(0, 3).map((t: any) => t.ticker).join(', ')}`);
      tickers = tickers.slice(0, 3);
      
      const newTotalWeight = tickers.reduce((sum: number, t: any) => sum + t.weight, 0);
      if (newTotalWeight > 0) {
        tickers = tickers.map((t: any) => ({ ...t, weight: t.weight / newTotalWeight }));
      }
    }

    // Set date range to 3 years
    const now = new Date();
    const period2 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const threeYearsAgo = new Date(period2);
    threeYearsAgo.setUTCFullYear(threeYearsAgo.getUTCFullYear() - 3);
    const period1 = threeYearsAgo;

    // Fetch data sequentially with delays to avoid rate limiting
    const charts = [];
    for (let i = 0; i < tickers.length; i++) {
      const t = tickers[i];
      
      try {
        // Add delay between requests
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }

        logger.info(`Fetching data for ${t.ticker} (${i + 1}/${tickers.length})`);
        const chart = await yahooFinanceService.getChartData(t.ticker, period1, period2, '1d');

        let points: Array<{ date: string; price: number }> = [];

        if (Array.isArray(chart?.quotes) && chart.quotes.length > 0 && chart.quotes[0]?.date) {
          points = chart.quotes
            .map((q: any) => ({
              date: q.date instanceof Date ? q.date.toISOString().slice(0, 10) : q.date,
              price: typeof q.adjclose === 'number' ? q.adjclose : q.close,
            }))
            .filter((p: any) => typeof p.price === 'number');
        } else if (Array.isArray(chart?.timestamp) && chart?.indicators) {
          const ts: number[] = chart.timestamp;
          const quote = Array.isArray(chart.indicators?.quote) ? chart.indicators.quote[0] : undefined;
          const adj = Array.isArray(chart.indicators?.adjclose) ? chart.indicators.adjclose[0] : undefined;

          points = ts.map((tSec: number, i: number) => {
            const close = Array.isArray(quote?.close) ? quote.close[i] : undefined;
            const adjClose = Array.isArray(adj?.adjclose) ? adj.adjclose[i] : undefined;
            const price = typeof adjClose === 'number' ? adjClose : close;
            return {
              date: new Date(tSec * 1000).toISOString().slice(0, 10),
              price,
            };
          }).filter((p: any) => typeof p.price === 'number');
        }

        points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

        logger.info(`Successfully fetched ${points.length} data points for ${t.ticker}`);
        charts.push({ ticker: t.ticker, weight: t.weight, points });
      } catch (error: any) {
        logger.error(`Error fetching chart data for ${t.ticker}:`, error.message);

        if (error.message?.includes('Too Many Requests') || error.message?.includes('429') || error.message?.includes('rate limit')) {
          logger.warn(`Rate limit hit for ${t.ticker}, skipping this ticker`);
          charts.push({ ticker: t.ticker, weight: t.weight, points: [] });
          
          if (i < tickers.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
          }
          continue;
        }

        charts.push({ ticker: t.ticker, weight: t.weight, points: [] });
      }
    }

    // Check if we have any valid data
    const chartsWithData = charts.filter(c => c.points.length > 0);
    if (chartsWithData.length === 0) {
      logger.warn('No valid chart data available');
      return res.json({
        points: [],
        warning: 'Market data temporarily unavailable due to service limits. Performance chart will update when data becomes available.'
      });
    }

    // Compute combined performance
    const firstDates = charts.map((c) => c.points[0]?.date).filter(Boolean) as string[];
    const startDate = firstDates.length === charts.length ? firstDates.sort().reverse()[0] : undefined;

    const union = new Set<string>();
    charts.forEach((c) => c.points.forEach((p) => union.add(p.date)));
    let dates = Array.from(union).filter((d) => !startDate || d >= startDate);
    dates.sort();

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
        for (const c of charts) {
          const p = priceMap[c.ticker][date];
          if (typeof p === 'number') lastPrice[c.ticker] = p;
        }
        points.push({ date, value: indexValue });
        continue;
      }

      let portfolioRatio = 0;
      let contributingWeight = 0;
      for (const c of charts) {
        const prev = lastPrice[c.ticker];
        const current = priceMap[c.ticker][date] ?? prev;
        if (typeof prev === 'number' && typeof current === 'number' && prev > 0) {
          const ratio = current / prev;
          portfolioRatio += c.weight * ratio;
          contributingWeight += c.weight;
          lastPrice[c.ticker] = current;
        } else if (typeof current === 'number' && typeof prev !== 'number') {
          lastPrice[c.ticker] = current;
        }
      }

      if (contributingWeight > 0) {
        const normalizedPortfolioRatio = portfolioRatio / contributingWeight;
        indexValue = indexValue * normalizedPortfolioRatio;
        points.push({ date, value: +indexValue.toFixed(4) });
      }
    }

    res.json({ points });
  } catch (error) {
    logger.error('Error computing portfolio performance:', error);
    res.status(500).json({
      message: 'Failed to compute portfolio performance',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * POST /api/admin/clear-cache
 * Clear Yahoo Finance cache (admin endpoint)
 */
router.post('/admin/clear-cache', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const entriesCleared = yahooFinanceService.clearCache();
    res.json({ message: 'Cache cleared successfully', entriesCleared });
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({ message: 'Failed to clear cache' });
  }
});

export default router;

