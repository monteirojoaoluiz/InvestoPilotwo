import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
} from "lucide-react";

interface ETF {
  ticker: string;
  name: string;
  description: string;
  assetType: string;
  category: string;
  expenseRatio?: number;
  riskLevel: "Low" | "Moderate" | "High";
  dividendYield?: number;
  yearlyGain?: number;
  lastPrice?: number;
  color: string;
}

interface ETFComparisonProps {
  etfs: ETF[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveETF: (ticker: string) => void;
}

export function ETFComparison({
  etfs,
  isOpen,
  onClose,
  onRemoveETF,
}: ETFComparisonProps) {
  if (etfs.length === 0) return null;

  const ComparisonRow = ({
    label,
    values,
    icon: Icon,
    formatter = (v: any) => v,
  }: {
    label: string;
    values: any[];
    icon?: any;
    formatter?: (v: any) => string;
  }) => (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `200px repeat(${etfs.length}, minmax(200px, 1fr))`,
      }}
    >
      <div className="flex items-center gap-2 py-3 text-sm font-medium text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </div>
      {values.map((value, idx) => (
        <div key={idx} className="rounded-lg bg-muted/30 px-4 py-3 text-center">
          <span className="font-medium">{formatter(value)}</span>
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-6xl">
        <DialogHeader>
          <DialogTitle>Compare ETFs</DialogTitle>
        </DialogHeader>

        <div className="h-[calc(90vh-120px)] overflow-auto pr-4">
          <div className="min-w-max space-y-6 pb-4">
            {/* ETF Headers */}
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `200px repeat(${etfs.length}, minmax(200px, 1fr))`,
              }}
            >
              <div className="py-3"></div>
              {etfs.map((etf) => (
                <div key={etf.ticker} className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div
                        className="h-4 w-4 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: etf.color }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold">
                          {etf.ticker}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {etf.name}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveETF(etf.ticker)}
                      className="h-6 w-6 flex-shrink-0 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Badge
                    variant={
                      etf.riskLevel === "Low"
                        ? "secondary"
                        : etf.riskLevel === "Moderate"
                          ? "default"
                          : "destructive"
                    }
                    className="w-full justify-center"
                  >
                    {etf.riskLevel}
                  </Badge>
                </div>
              ))}
            </div>

            <Separator />

            {/* Basic Information */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Basic Information</h3>
              <div className="space-y-2">
                <ComparisonRow
                  label="Asset Type"
                  values={etfs.map((e) => e.assetType)}
                />
                <ComparisonRow
                  label="Category"
                  values={etfs.map((e) => e.category)}
                />
                <ComparisonRow
                  label="Risk Level"
                  values={etfs.map((e) => e.riskLevel)}
                />
              </div>
            </div>

            <Separator />

            {/* Performance Metrics */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">
                Performance Metrics
              </h3>
              <div className="space-y-2">
                <ComparisonRow
                  label="Expense Ratio"
                  icon={DollarSign}
                  values={etfs.map((e) => e.expenseRatio)}
                  formatter={(v) =>
                    typeof v === "number" ? `${v.toFixed(2)}%` : "N/A"
                  }
                />
                <ComparisonRow
                  label="Dividend Yield"
                  icon={TrendingDown}
                  values={etfs.map((e) => e.dividendYield)}
                  formatter={(v) =>
                    typeof v === "number" ? `${v.toFixed(2)}%` : "N/A"
                  }
                />
                <ComparisonRow
                  label="Annual Return"
                  icon={BarChart3}
                  values={etfs.map((e) => e.yearlyGain)}
                  formatter={(v) =>
                    typeof v === "number"
                      ? `${v > 0 ? "+" : ""}${v.toFixed(1)}%`
                      : "N/A"
                  }
                />
                <ComparisonRow
                  label="Last Price"
                  icon={DollarSign}
                  values={etfs.map((e) => e.lastPrice)}
                  formatter={(v) =>
                    typeof v === "number" ? `$${v.toFixed(2)}` : "N/A"
                  }
                />
              </div>
            </div>

            <Separator />

            {/* Best/Worst Indicators */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">
                Comparison Highlights
              </h3>
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `200px repeat(${etfs.length}, minmax(200px, 1fr))`,
                }}
              >
                <div className="py-3 text-sm font-medium text-muted-foreground">
                  Expense Ratio
                </div>
                {(() => {
                  const numericExpenses = etfs
                    .map((e) => e.expenseRatio)
                    .filter((v) => typeof v === "number");
                  const lowestExpense = numericExpenses.length
                    ? Math.min(...numericExpenses)
                    : undefined;
                  return etfs.map((etf) => {
                    const isLowest =
                      typeof etf.expenseRatio === "number" &&
                      lowestExpense !== undefined &&
                      etf.expenseRatio === lowestExpense;
                    return (
                      <div
                        key={etf.ticker}
                        className="rounded-lg bg-muted/30 px-4 py-3 text-center"
                      >
                        {isLowest && (
                          <Badge variant="secondary" className="text-xs">
                            Lowest
                          </Badge>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              <div
                className="mt-2 grid gap-4"
                style={{
                  gridTemplateColumns: `200px repeat(${etfs.length}, minmax(200px, 1fr))`,
                }}
              >
                <div className="py-3 text-sm font-medium text-muted-foreground">
                  Annual Return
                </div>
                {etfs.map((etf) => {
                  const highestReturn = Math.max(
                    ...etfs.map((e) => e.yearlyGain || 0),
                  );
                  const isHighest =
                    etf.yearlyGain === highestReturn && etf.yearlyGain;
                  return (
                    <div
                      key={etf.ticker}
                      className="rounded-lg bg-muted/30 px-4 py-3 text-center"
                    >
                      {isHighest && (
                        <Badge variant="default" className="text-xs">
                          Highest
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
