import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { usePortfolio } from '../hooks/usePortfolio';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import { Button } from '../components/ui/button';
import { ProfileCard } from '../components/dashboard/ProfileCard';
import { PortfolioCard } from '../components/dashboard/PortfolioCard';
import { PerformanceCard } from '../components/dashboard/PerformanceCard';
import { PerformanceChartCard } from '../components/dashboard/PerformanceChartCard';
import PortfolioChat from '../components/PortfolioChat';

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Force scroll to top on mount
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    const scrollToTop = () => window.scrollTo(0, 0);
    scrollToTop();
    const timeouts = [
      setTimeout(scrollToTop, 0),
      setTimeout(scrollToTop, 50),
      setTimeout(scrollToTop, 100),
    ];
    return () => {
      timeouts.forEach(clearTimeout);
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'auto';
      }
    };
  }, []);

  const { data: portfolioData, refetch: refetchPortfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/portfolio');
      if (!res.ok) throw new Error('Failed to fetch portfolio');
      return res.json();
    },
  });

  const { data: assessmentData } = useQuery({
    queryKey: ['assessment'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/risk-assessment');
      if (!res.ok) throw new Error('Failed to fetch assessment');
      return res.json();
    },
  });

  const portfolioId = portfolioData?.id;
  const { data: combined } = useQuery<{ points: { date: string; value: number }[]; warning?: string } | null>({
    queryKey: ['portfolio-performance', portfolioId || 'default'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/portfolio/performance`);
      if (!res.ok) throw new Error('Failed to fetch portfolio performance');
      return res.json();
    },
    enabled: !!portfolioData,
  });

  const metrics = useMemo(() => {
    try {
      const pts = combined?.points || [];
      if (combined?.warning || !pts || pts.length < 2) return null;

      const firstVal = pts[0]?.value;
      const lastVal = pts[pts.length - 1]?.value;
      if (typeof firstVal !== 'number' || typeof lastVal !== 'number' || firstVal <= 0) {
        return null;
      }

      const totalGainPct = ((lastVal / firstVal) - 1) * 100;

      const dailyReturns: number[] = [];
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1]?.value;
        const cur = pts[i]?.value;
        if (typeof prev === 'number' && typeof cur === 'number' && prev > 0 && cur > 0) {
          dailyReturns.push((cur / prev) - 1);
        }
      }

      const meanDaily = dailyReturns.length ? (dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length) : 0;
      const varianceDaily = dailyReturns.length > 1
        ? dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanDaily, 2), 0) / (dailyReturns.length - 1)
        : 0;
      const stdDaily = Math.sqrt(varianceDaily);
      const annualizedReturn = meanDaily * 252;
      const annualizedVol = stdDaily * Math.sqrt(252);
      const sharpe = annualizedVol > 0 ? (annualizedReturn / annualizedVol) : 0;

      const yearMap = new Map<number, { first?: number; last?: number }>();
      for (const p of pts) {
        if (!p?.date || typeof p.value !== 'number') continue;
        try {
          const y = new Date(p.date).getFullYear();
          const entry = yearMap.get(y) || {};
          if (entry.first == null) entry.first = p.value;
          entry.last = p.value;
          yearMap.set(y, entry);
        } catch {
          continue;
        }
      }

      const years = Array.from(yearMap.keys()).sort((a, b) => a - b);
      const lastThreeYears = years.slice(-3);
      const gainsPerYear = lastThreeYears.map((y) => {
        const e = yearMap.get(y);
        const gain = (e?.first && e?.last && e.first > 0) ? ((e.last / e.first) - 1) * 100 : 0;
        return { year: y, gainPct: gain };
      });

      const yearlyAvgGain = gainsPerYear.length > 0
        ? gainsPerYear.reduce((sum, g) => sum + g.gainPct, 0) / gainsPerYear.length
        : 0;

      return {
        totalGainPct,
        annualizedVolPct: annualizedVol * 100,
        sharpe,
        gainsPerYear,
        yearlyAvgGain,
      };
    } catch (error) {
      console.error('Error calculating metrics:', error);
      return null;
    }
  }, [combined?.points]);

  const handleGeneratePortfolio = async () => {
    try {
      const res = await apiRequest('POST', '/api/portfolio/generate');
      if (!res.ok) {
        throw new Error(`Failed to generate: ${res.statusText}`);
      }
      const newPortfolio = await res.json();
      if (!newPortfolio) {
        throw new Error('Invalid portfolio data received');
      }
      await refetchPortfolio();
      toast({
        title: "Portfolio Generated!",
        description: "Your recommendations are now available.",
      });
    } catch (error) {
      console.error('Portfolio generation error:', error);
      toast({
        title: "Failed to Generate",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const hasAssessmentButNoPortfolio = assessmentData && !portfolioData;

  return (
    <div className="p-4 sm:p-6 w-full min-w-0 max-w-full overflow-x-hidden">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 break-words">Stack16 Dashboard</h1>
      
      {hasAssessmentButNoPortfolio && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 mb-2">Your investor profile is complete, but no portfolio has been generated yet.</p>
          <Button onClick={handleGeneratePortfolio} className="mr-2">
            Generate Portfolio Now
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            View Dashboard
          </Button>
        </div>
      )}
      
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-full min-w-0">
        <ProfileCard assessmentData={assessmentData} />
        <PortfolioCard portfolioData={portfolioData} />
        <PerformanceCard metrics={metrics} />
      </div>

      {portfolioData && (
        <div className="mt-6 space-y-6">
          <PerformanceChartCard data={combined || null} />
          <PortfolioChat portfolio={portfolioData} />
        </div>
      )}

      {portfolioData === null && !hasAssessmentButNoPortfolio && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">No portfolio available. Start by completing your investor profile.</p>
          <Button variant="outline" onClick={() => navigate('/assessment')} className="mt-2">
            Build Profile
          </Button>
        </div>
      )}
    </div>
  );
}
