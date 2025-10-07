import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/queryClient';

interface PortfolioCardProps {
  portfolioData: any;
}

export function PortfolioCard({ portfolioData }: PortfolioCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState('');

  const { data: etfInfo } = useQuery({
    queryKey: ['etf-info', selectedTicker],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', `/api/etf/${selectedTicker}/info`);
        if (!res.ok) throw new Error('Failed to fetch ETF info');
        return res.json();
      } catch (error) {
        console.error('Error fetching ETF info:', error);
        throw error;
      }
    },
    enabled: !!selectedTicker,
  });

  if (!portfolioData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl lg:text-2xl">Recommended Portfolio</CardTitle>
          <CardDescription>Your personalized investment allocations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-2">No portfolio recommendations yet</div>
            <p className="text-sm text-muted-foreground">Complete your risk assessment to get personalized allocations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl lg:text-2xl">Recommended Portfolio</CardTitle>
          <CardDescription>Your personalized investment allocations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            {/* Donut Chart */}
            <div className="flex-shrink-0 w-full max-w-[220px] sm:max-w-[200px] mx-auto">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={(portfolioData.allocations || [])?.map((a: any) => ({
                      name: a?.ticker || a?.name || 'Unknown',
                      value: typeof a?.percentage === 'number' ? a.percentage : 0,
                      color: a?.color || '#8884d8'
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {(portfolioData.allocations || [])?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry?.color || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value}%`, 'Allocation']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Allocation List */}
            <div className="w-full space-y-3">
              {(portfolioData.allocations || [])?.map((a: any, index: number) => (
                <div
                  key={`${a?.ticker || a?.name || `allocation-${index}`}`}
                  className="flex items-center justify-between py-2 cursor-pointer hover:bg-muted/50 rounded"
                  onClick={() => {
                    if (a?.ticker) {
                      setSelectedTicker(a.ticker);
                      setModalOpen(true);
                    }
                  }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: a?.color || '#8884d8' }}
                    />
                    <div>
                      <div className="font-semibold text-sm">{a?.ticker || a?.name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{a?.assetType || 'ETF'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">{typeof a?.percentage === 'number' ? a.percentage : 0}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{selectedTicker} Details</DialogTitle>
          </DialogHeader>
          {etfInfo ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Fund Name</h3>
                <p>{etfInfo?.longName || selectedTicker}</p>
              </div>
              <div>
                <h3 className="font-semibold">Category</h3>
                <p>{etfInfo?.category || 'N/A'}</p>
              </div>
              {etfInfo?.summaryProfile?.longBusinessSummary && (
                <div>
                  <h3 className="font-semibold">Description</h3>
                  <p className="text-sm">{etfInfo.summaryProfile.longBusinessSummary}</p>
                </div>
              )}
              <div>
                <h3 className="font-semibold">Expense Ratio</h3>
                <p>
                  {etfInfo?.summaryDetail?.annualReportExpenseRatio
                    ? `${(etfInfo.summaryDetail.annualReportExpenseRatio * 100).toFixed(2)}%`
                    : 'N/A (not available via current API)'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Top 10 Holdings</h3>
                <p className="text-sm text-muted-foreground italic">
                  Detailed holdings data not available via current API. Please refer to the ETF provider's website for complete holdings information.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p>Loading ETF details...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

