import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export function useETFFavorites() {
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("etf-catalog-favorites");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Persist favorites
  useEffect(() => {
    localStorage.setItem(
      "etf-catalog-favorites",
      JSON.stringify(Array.from(favorites)),
    );
  }, [favorites]);

  const toggleFavorite = (ticker: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(ticker)) {
        newFavorites.delete(ticker);
        toast({
          title: "Removed from favorites",
          description: `${ticker} has been removed from your watchlist.`,
        });
      } else {
        newFavorites.add(ticker);
        toast({
          title: "Added to favorites",
          description: `${ticker} has been added to your watchlist.`,
        });
      }
      return newFavorites;
    });
  };

  return { favorites, toggleFavorite };
}
