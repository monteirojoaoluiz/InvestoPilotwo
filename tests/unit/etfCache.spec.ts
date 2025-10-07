import { describe, it, expect } from 'vitest';
import { getCachedYahooData, setCachedYahooData } from '../../server/services/etfService';

describe('etfService cache', () => {
  it('returns null when cache is empty and returns data after set', () => {
    const ticker = 'TEST';
    const period1 = new Date(2020, 0, 1);
    const period2 = new Date(2020, 0, 2);
    const interval = '1d';

    const before = getCachedYahooData(ticker, period1, period2, interval);
    expect(before).toBeNull();

    const fake = { quotes: [{ date: '2020-01-01', close: 100 }] };
    setCachedYahooData(ticker, period1, period2, interval, fake);

    const after = getCachedYahooData(ticker, period1, period2, interval);
    expect(after).toEqual(fake);
  });
});
