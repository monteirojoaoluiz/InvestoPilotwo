import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, X } from "lucide-react";

interface ComparisonBarProps {
  selectedTickers: string[];
  onRemoveTicker: (ticker: string) => void;
  onClearAll: () => void;
  onCompare: () => void;
}

export function ComparisonBar({
  selectedTickers,
  onRemoveTicker,
  onClearAll,
  onCompare,
}: ComparisonBarProps) {
  if (selectedTickers.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4 shadow-lg duration-300 animate-in slide-in-from-bottom">
      <div className="container mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium">
            {selectedTickers.length} ETF
            {selectedTickers.length > 1 ? "s" : ""} selected for comparison
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedTickers.map((ticker) => (
              <Badge
                key={ticker}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {ticker}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => onRemoveTicker(ticker)}
                />
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClearAll}>
            Clear
          </Button>
          <Button
            size="sm"
            onClick={onCompare}
            disabled={selectedTickers.length < 2}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Compare
          </Button>
        </div>
      </div>
    </div>
  );
}
