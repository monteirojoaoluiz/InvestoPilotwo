import { Request, Response } from 'express';
import { getHistoricalChart, getQuote } from '../services/etfService';

export async function getHistory(req: Request, res: Response) {
  try {
    const { ticker } = req.params as { ticker: string };
    const { range = '1y', interval = '1wk' } = req.query as { range?: string; interval?: string };

    const now = new Date();
    const period2 = now;
    const period1 = new Date(now);
    const r = (range || '1y').toLowerCase();
    if (r.includes('3y')) period1.setFullYear(period1.getFullYear() - 3);
    else if (r.includes('5y')) period1.setFullYear(period1.getFullYear() - 5);
    else if (r.includes('6m') || r.includes('6mo')) period1.setMonth(period1.getMonth() - 6);
    else period1.setFullYear(period1.getFullYear() - 1);

    const chart = await getHistoricalChart(ticker, period1, period2, interval as string);

    const points = ((chart as any).quotes || []).map((q: any) => ({
      date: q.date instanceof Date ? q.date.toISOString().slice(0, 10) : q.date,
      close: q.close,
    })).filter((p: any) => typeof p.close === 'number');

    res.json({ ticker, range, interval, points });
  } catch (error) {
    console.error('Error fetching ETF history:', error);
    res.status(500).json({ message: 'Failed to fetch ETF history' });
  }
}

export async function getInfo(req: Request, res: Response) {
  try {
    const { ticker } = req.params;
    const quote = await getQuote(ticker);
    res.json(quote);
  } catch (error) {
    console.error('Error fetching ETF info:', error);
    res.status(500).json({ message: 'Failed to fetch ETF information' });
  }
}
