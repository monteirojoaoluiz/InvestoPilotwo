// New ETF service encapsulating Yahoo Finance access and simple in-memory cache
import yahooFinance from 'yahoo-finance2';

type CachedEntry = { data: any; timestamp: number };

const yahooCache = new Map<string, CachedEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function makeCacheKey(ticker: string, period1?: Date, period2?: Date, interval?: string) {
  const p1 = period1 ? period1.getTime() : 'none';
  const p2 = period2 ? period2.getTime() : 'none';
  return `${ticker}-${p1}-${p2}-${interval || 'none'}`;
}

export function getCachedYahooData(ticker: string, period1?: Date, period2?: Date, interval?: string) {
  const key = makeCacheKey(ticker, period1, period2, interval);
  const cached = yahooCache.get(key);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

export function setCachedYahooData(ticker: string, period1: Date | undefined, period2: Date | undefined, interval: string | undefined, data: any) {
  const key = makeCacheKey(ticker, period1, period2, interval);
  yahooCache.set(key, { data, timestamp: Date.now() });
}

export async function getHistoricalChart(ticker: string, period1: Date, period2: Date, interval: string) {
  const cached = getCachedYahooData(ticker, period1, period2, interval);
  if (cached) return cached;

  const chart = await yahooFinance.chart(ticker, { period1, period2, interval } as any).catch((err) => {
    // Bubble up error but allow callers to handle rate limiting gracefully
    throw err;
  });

  setCachedYahooData(ticker, period1, period2, interval, chart);
  return chart;
}

export async function getQuote(ticker: string) {
  const key = `quote-${ticker}`;
  const cached = yahooCache.get(key);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) return cached.data;
  const quote = await yahooFinance.quote(ticker).catch((err) => {
    throw err;
  });
  yahooCache.set(key, { data: quote, timestamp: Date.now() });
  return quote;
}
