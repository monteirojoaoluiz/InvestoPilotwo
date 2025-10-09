import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/auth/user");
        if (!res.ok) {
          console.log("Not authenticated - status:", res.status);
          return null;
        }
        const userData = await res.json();
        console.log("Authenticated user:", userData.email);
        return userData;
      } catch (error) {
        console.error("Auth check failed:", error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - user auth state doesn't change often
    gcTime: 30 * 60 * 1000, // 30 minutes in cache
    retry: false,
  });

  const isAuthenticated = !!user;

  return { isAuthenticated, isLoading, user };
}
