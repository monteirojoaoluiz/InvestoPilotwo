import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export function usePortfolioMessages(portfolioId: string | null) {
  return useQuery({
    queryKey: ["/api/portfolio", portfolioId, "messages"],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/portfolio/${portfolioId}/messages`,
      );
      const data = await res.json();
      return data.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender,
        timestamp: new Date(msg.createdAt),
      })) as Message[];
    },
    enabled: !!portfolioId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}
