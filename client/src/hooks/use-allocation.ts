import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  InvestorProfile,
  AssetAllocation,
  InsertInvestorProfile,
} from '@shared/schema';

// Fetch current asset allocation for a user
export function useCurrentAllocation(userId?: string) {
  return useQuery<AssetAllocation | null>({
    queryKey: ['asset-allocation', 'current', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      const response = await fetch(
        `/api/asset-allocations/user/${userId}/current`,
        {
          credentials: 'include',
        }
      );

      // Return null for 404 without trying to parse JSON
      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch asset allocation');
      }

      return response.json();
    },
    enabled: !!userId,
  });
}

// Fetch current investor profile for a user
export function useCurrentProfile(userId?: string) {
  return useQuery<InvestorProfile | null>({
    queryKey: ['investor-profile', 'current', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      const response = await fetch(`/api/investor-profiles/user/${userId}`, {
        credentials: 'include',
      });

      // Return null for 404 without trying to parse JSON
      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch investor profile');
      }

      return response.json();
    },
    enabled: !!userId,
  });
}

// Create or update investor profile
export function useCreateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: {
      riskAssessmentId: string;
      riskTolerance: number;
      investmentHorizon: number;
      riskCapacity: string;
      experienceLevel: string;
      cashOtherPreference: number;
    }) => {
      const response = await fetch('/api/investor-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        // Try to parse JSON error, but fall back to text if it fails
        let errorMessage = 'Failed to create investor profile';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          // If JSON parsing fails, try to get text
          const text = await response.text();
          console.error('Non-JSON error response:', text.substring(0, 200));
          errorMessage = `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      return response.json() as Promise<InvestorProfile>;
    },
    onSuccess: (data) => {
      // Invalidate current profile query to refetch
      queryClient.invalidateQueries({
        queryKey: ['investor-profile', 'current', data.userId],
      });
    },
  });
}

// Create asset allocation from investor profile
export function useCreateAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (investorProfileId: string) => {
      const response = await fetch('/api/asset-allocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ investorProfileId }),
      });

      if (!response.ok) {
        // Try to parse JSON error, but fall back to text if it fails
        let errorMessage = 'Failed to create asset allocation';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          // If JSON parsing fails, try to get text
          const text = await response.text();
          console.error('Non-JSON error response:', text.substring(0, 200));
          errorMessage = `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      return response.json() as Promise<AssetAllocation>;
    },
    onSuccess: (data) => {
      // Invalidate current allocation query to refetch
      queryClient.invalidateQueries({
        queryKey: ['asset-allocation', 'current', data.userId],
      });
    },
  });
}
