/**
 * Portfolio Optimization Page
 * Triggers portfolio optimization and displays results
 */
import OptimizedPortfolio from "@/components/OptimizedPortfolio";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function PortfolioOptimizationPage() {
  const [optimizedPortfolio, setOptimizedPortfolio] = useState<any>(null);
  const queryClient = useQueryClient();

  // Check if risk assessment exists
  const { data: assessment, isLoading: assessmentLoading } = useQuery({
    queryKey: ["/api/risk-assessment"],
  });

  // Optimize portfolio mutation
  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/portfolio/optimize", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Optimization failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setOptimizedPortfolio(data);
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
    },
  });

  const handleOptimize = () => {
    optimizeMutation.mutate();
  };

  if (assessmentLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
              <div className="space-y-2">
                <p className="font-medium text-yellow-900">
                  Risk Assessment Required
                </p>
                <p className="text-sm text-yellow-800">
                  Please complete your risk assessment before generating an
                  optimized portfolio.
                </p>
                <Button
                  variant="default"
                  onClick={() => (window.location.href = "/risk-assessment")}
                  className="mt-2"
                >
                  Complete Risk Assessment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Portfolio Optimization</h1>
          <p className="text-muted-foreground">
            Generate an optimized portfolio based on modern portfolio theory and
            your risk profile
          </p>
        </div>

        {/* Optimization Trigger */}
        {!optimizedPortfolio && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Advanced Portfolio Optimization
              </CardTitle>
              <CardDescription>
                Our algorithm uses CVXPY (Convex Optimization) to construct an
                efficient portfolio that maximizes risk-adjusted returns while
                respecting your constraints.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2 rounded-lg bg-muted p-4 text-sm">
                  <p className="font-medium">Optimization Features:</p>
                  <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                    <li>
                      Ledoit-Wolf covariance shrinkage for robust risk estimates
                    </li>
                    <li>
                      Mean-variance optimization with risk aversion tailored to
                      your profile
                    </li>
                    <li>
                      Geographic diversification across your preferred regions
                    </li>
                    <li>Industry exclusions based on your ESG preferences</li>
                    <li>
                      Cost minimization (TER) and liquidity considerations
                    </li>
                    <li>Cardinality constraints for portfolio simplicity</li>
                  </ul>
                </div>

                <Button
                  onClick={handleOptimize}
                  disabled={optimizeMutation.isPending}
                  size="lg"
                  className="w-full"
                >
                  {optimizeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Optimizing Portfolio...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Optimized Portfolio
                    </>
                  )}
                </Button>

                {optimizeMutation.isError && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                      <div className="flex gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                        <div className="space-y-1">
                          <p className="font-medium text-red-900">
                            Optimization Failed
                          </p>
                          <p className="text-sm text-red-800">
                            {optimizeMutation.error instanceof Error
                              ? optimizeMutation.error.message
                              : "An error occurred during optimization"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show optimized portfolio if available */}
        {optimizedPortfolio && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Your Optimized Portfolio</h2>
                <p className="text-sm text-muted-foreground">
                  Generated on {new Date().toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleOptimize}
                disabled={optimizeMutation.isPending}
              >
                {optimizeMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Re-optimize"
                )}
              </Button>
            </div>

            <OptimizedPortfolio
              portfolio={optimizedPortfolio.optimization}
              allocations={optimizedPortfolio.allocations}
            />
          </>
        )}
      </div>
    </div>
  );
}
