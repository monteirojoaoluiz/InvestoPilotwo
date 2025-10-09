import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function useETFComparison() {
  const { toast } = useToast();
  const [selectedForComparison, setSelectedForComparison] = useState<
    Set<string>
  >(new Set());

  const toggleComparison = (ticker: string) => {
    setSelectedForComparison((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(ticker)) {
        newSelection.delete(ticker);
      } else {
        if (newSelection.size >= 4) {
          toast({
            title: "Maximum reached",
            description: "You can compare up to 4 ETFs at a time.",
            variant: "destructive",
          });
          return prev;
        }
        newSelection.add(ticker);
      }
      return newSelection;
    });
  };

  const clearComparison = () => {
    setSelectedForComparison(new Set());
  };

  return {
    selectedForComparison,
    toggleComparison,
    clearComparison,
  };
}
