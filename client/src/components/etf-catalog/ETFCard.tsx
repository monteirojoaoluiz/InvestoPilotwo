import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ETF } from "@/data/etfs";
import { Heart, BarChart3, Eye } from "lucide-react";

interface ETFCardProps {
  etf: ETF;
  isFavorite: boolean;
  isInComparison: boolean;
  onToggleFavorite: (ticker: string) => void;
  onToggleComparison: (ticker: string) => void;
  onViewDetails: (etf: ETF) => void;
}

export function ETFCard({
  etf,
  isFavorite,
  isInComparison,
  onToggleFavorite,
  onToggleComparison,
  onViewDetails,
}: ETFCardProps) {
  return (
    <Card className="group/card relative flex flex-col transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
      <div onClick={() => onViewDetails(etf)} className="flex-1 cursor-pointer">
        <CardHeader className="pb-3 pt-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="h-4 w-4 flex-shrink-0 rounded-full"
                style={{ backgroundColor: etf.color }}
              />
              <div>
                <CardTitle className="text-lg">{etf.ticker}</CardTitle>
                <CardDescription className="text-sm font-medium">
                  {etf.name}
                </CardDescription>
              </div>
            </div>
          </div>
          <Badge
            variant={
              etf.riskLevel === "Low"
                ? "secondary"
                : etf.riskLevel === "Moderate"
                  ? "default"
                  : "destructive"
            }
            className="mt-2 w-fit"
          >
            {etf.riskLevel}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {etf.description}
          </p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium">Asset Type:</span>
              <p className="text-muted-foreground">{etf.assetType}</p>
            </div>
            <div>
              <span className="font-medium">Category:</span>
              <p className="text-muted-foreground">{etf.category}</p>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Bottom Action Buttons */}
      <CardContent className="pb-4 pt-0">
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={isFavorite ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(etf.ticker);
            }}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
            <span className="hidden sm:inline">
              {isFavorite ? "Favorited" : "Favorite"}
            </span>
          </Button>
          <Button
            variant={isInComparison ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComparison(etf.ticker);
            }}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isInComparison ? "Selected" : "Compare"}
            </span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => onViewDetails(etf)}
          >
            <Eye className="h-4 w-4" />
            <span className="sm:hidden">Details</span>
            <span className="hidden sm:inline">View Details</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
