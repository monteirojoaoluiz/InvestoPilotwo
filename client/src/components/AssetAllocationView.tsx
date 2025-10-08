import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { AssetAllocation } from "@shared/schema";
import type { AllocationMetadata } from "@shared/types";

interface AssetAllocationViewProps {
  allocation: AssetAllocation;
}

export function AssetAllocationView({ allocation }: AssetAllocationViewProps) {
  const equity = parseFloat(allocation.equityPercent);
  const bonds = parseFloat(allocation.bondsPercent);
  const cash = parseFloat(allocation.cashPercent);
  const other = parseFloat(allocation.otherPercent);

  const metadata = allocation.allocationMetadata as AllocationMetadata | null;

  return (
    <div className="space-y-6">
      {/* Main Allocation Card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Asset Allocation</CardTitle>
          <CardDescription>
            Recommended portfolio distribution based on your investor profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Equity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">Stocks/Equity</span>
                {metadata?.capacityConstraint.capApplied && (
                  <Badge variant="outline" className="text-xs">
                    Capped
                  </Badge>
                )}
              </div>
              <span className="text-2xl font-bold text-chart-1">{equity.toFixed(2)}%</span>
            </div>
            <Progress value={equity} className="h-3 bg-muted" />
          </div>

          {/* Bonds */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Bonds/Fixed Income</span>
              <span className="text-2xl font-bold text-chart-3">{bonds.toFixed(2)}%</span>
            </div>
            <Progress value={bonds} className="h-3 bg-muted" />
          </div>

          {/* Cash */}
          {cash > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Cash</span>
                <span className="text-2xl font-bold text-chart-4">{cash.toFixed(2)}%</span>
              </div>
              <Progress value={cash} className="h-3 bg-muted" />
            </div>
          )}

          {/* Other */}
          {other > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Other Assets</span>
                <span className="text-2xl font-bold text-chart-2">{other.toFixed(2)}%</span>
              </div>
              <Progress value={other} className="h-3 bg-muted" />
            </div>
          )}

          {/* Holdings Count */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Recommended Holdings</span>
              <span className="text-lg font-semibold">{allocation.holdingsCount}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Number of different investments in your portfolio
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Calculation Details Card */}
      {metadata && (
        <Card>
          <CardHeader>
            <CardTitle>Calculation Details</CardTitle>
            <CardDescription>
              How your allocation was determined
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Base Allocation */}
            <div>
              <h4 className="font-medium text-sm mb-2">1. Base Allocation (Risk Tolerance)</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Equity:</span>
                  <span>{metadata.baseAllocation.equity.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Bonds:</span>
                  <span>{metadata.baseAllocation.bonds.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Horizon Adjustment */}
            {metadata.horizonAdjustment.equityIncrease > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">2. Investment Horizon Adjustment</h4>
                <div className="text-sm text-muted-foreground">
                  <p>
                    {metadata.horizonAdjustment.horizonCategory === "long" && "Long-term horizon"}
                    {metadata.horizonAdjustment.horizonCategory === "medium" && "Medium-term horizon"}
                    {metadata.horizonAdjustment.horizonCategory === "short" && "Short-term horizon"}
                    : +{metadata.horizonAdjustment.equityIncrease}% equity
                  </p>
                </div>
              </div>
            )}

            {/* Capacity Constraint */}
            {metadata.capacityConstraint.capApplied && (
              <div>
                <h4 className="font-medium text-sm mb-2">3. Risk Capacity Constraint</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    Your {metadata.capacityConstraint.capacityLevel} risk capacity limits equity to{" "}
                    {metadata.capacityConstraint.cappedEquity.toFixed(1)}%
                  </p>
                  <p className="text-xs">
                    (Original: {metadata.capacityConstraint.originalEquity.toFixed(1)}%)
                  </p>
                </div>
              </div>
            )}

            {/* Remainder Split */}
            {metadata.remainderSplit.totalRemainder > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">4. Remainder Distribution</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Cash:</span>
                    <span>{metadata.remainderSplit.cashPercent.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other:</span>
                    <span>{metadata.remainderSplit.otherPercent.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Boundary Interpolation */}
            {metadata.boundaryInterpolation?.applied && (
              <div>
                <h4 className="font-medium text-sm mb-2">Boundary Interpolation</h4>
                <div className="text-sm text-muted-foreground">
                  <p>
                    Risk tolerance of {metadata.boundaryInterpolation.riskTolerance} is at a boundary, so we averaged the{" "}
                    {metadata.boundaryInterpolation.band1} and {metadata.boundaryInterpolation.band2} bands.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
