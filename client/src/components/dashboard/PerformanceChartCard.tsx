import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface PerformanceChartCardProps {
  data: { points: { date: string; value: number }[]; warning?: string } | null;
}

export function PerformanceChartCard({ data }: PerformanceChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Performance (3Y, Daily)</CardTitle>
        <CardDescription>
          Normalized index (100 = start)
          {data?.warning && (
            <div className="mt-2 text-amber-600 dark:text-amber-400 text-sm">
              ⚠️ {data.warning}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.points || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={'date'}
                tickFormatter={(dateStr) => {
                  try {
                    if (!dateStr) return '';
                    const date = new Date(dateStr);
                    if (isNaN(date.getTime())) return '';
                    return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
                  } catch {
                    return '';
                  }
                }}
                interval="preserveStartEnd"
                minTickGap={80}
                angle={-45}
                textAnchor="end"
                height={60}
                className="text-xs"
              />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip
                labelFormatter={(dateStr) => {
                  try {
                    if (!dateStr) return '';
                    const date = new Date(dateStr);
                    if (isNaN(date.getTime())) return '';
                    return date.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    });
                  } catch {
                    return '';
                  }
                }}
              />
              <Line type="monotone" dataKey={'value'} stroke="#8884d8" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

