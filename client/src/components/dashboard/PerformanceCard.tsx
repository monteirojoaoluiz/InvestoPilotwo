import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface PerformanceMetrics {
  totalGainPct: number;
  annualizedVolPct: number;
  sharpe: number;
  gainsPerYear: { year: number; gainPct: number }[];
  yearlyAvgGain: number;
}

interface PerformanceCardProps {
  metrics: PerformanceMetrics | null;
}

export function PerformanceCard({ metrics }: PerformanceCardProps) {
  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
          <CardDescription>Performance metrics will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Complete your portfolio to see performance metrics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl lg:text-2xl">3-Year Performance</CardTitle>
        <CardDescription>Historical portfolio metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Total Return</div>
              <div className={`text-2xl font-bold ${metrics.totalGainPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.totalGainPct >= 0 ? '+' : ''}{metrics.totalGainPct.toFixed(1)}%
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Avg Annual</div>
              <div className={`text-2xl font-bold ${metrics.yearlyAvgGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.yearlyAvgGain >= 0 ? '+' : ''}{metrics.yearlyAvgGain.toFixed(1)}%
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Volatility</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metrics.annualizedVolPct.toFixed(1)}%
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Sharpe Ratio</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metrics.sharpe.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Annual Performance Timeline */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">Annual Performance</h4>
            <div className="space-y-4">
              {metrics.gainsPerYear.map((g) => (
                <div key={g.year} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12 text-center">{g.year}</div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 relative overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${g.gainPct >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{
                          width: `${Math.min(Math.abs(g.gainPct) * 3, 100)}%`,
                          marginLeft: g.gainPct < 0 ? `${100 - Math.min(Math.abs(g.gainPct) * 3, 100)}%` : '0%'
                        }}
                      />
                    </div>
                  </div>
                  <div className={`text-sm font-bold w-16 text-right ${g.gainPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {g.gainPct >= 0 ? '+' : ''}{g.gainPct.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

