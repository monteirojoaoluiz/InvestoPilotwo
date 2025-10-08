import { useAuth } from "@/hooks/useAuth";
import { useCurrentAllocation, useCurrentProfile, useCreateProfile, useCreateAllocation } from "@/hooks/use-allocation";
import { InvestorProfileForm } from "@/components/InvestorProfileForm";
import { AssetAllocationView } from "@/components/AssetAllocationView";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function PortfolioAllocationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const createProfile = useCreateProfile();
  const createAllocation = useCreateAllocation();

  // Fetch existing risk assessment
  const {
    data: riskAssessment,
    isLoading: assessmentLoading,
  } = useQuery<any>({
    queryKey: ['/api/risk-assessment'],
    enabled: !!user,
  });

  // Fetch current profile and allocation
  const {
    data: profile,
    isLoading: profileLoading,
  } = useCurrentProfile(user?.id);

  const {
    data: allocation,
    isLoading: allocationLoading,
    refetch: refetchAllocation,
  } = useCurrentAllocation(user?.id);

  // Auto-generate profile and allocation if user has assessment but no allocation
  useEffect(() => {
    const autoGenerate = async () => {
      if (riskAssessment && !allocation && !isGenerating && !allocationLoading) {
        try {
          setIsGenerating(true);
          
          // Map risk assessment to investor profile
          const investorProfile = riskAssessment.investorProfile;
          
          // Create investor profile from risk assessment
          const newProfile = await createProfile.mutateAsync({
            riskAssessmentId: riskAssessment.id,
            riskTolerance: investorProfile.risk_tolerance || 50,
            investmentHorizon: Math.round((investorProfile.investment_horizon || 50) / 10), // Convert 0-100 to years estimate
            riskCapacity: investorProfile.risk_capacity < 33 ? 'low' : investorProfile.risk_capacity < 67 ? 'medium' : 'high',
            experienceLevel: investorProfile.investor_experience < 25 ? 'beginner' : 
                           investorProfile.investor_experience < 50 ? 'intermediate' : 
                           investorProfile.investor_experience < 75 ? 'experienced' : 'expert',
            cashOtherPreference: 50, // Default balanced
          });

          // Calculate allocation
          await createAllocation.mutateAsync(newProfile.id);
          
          await refetchAllocation();
          
          toast({
            title: "Allocation Generated",
            description: "Your personalized asset allocation has been created based on your investor profile.",
          });
        } catch (error) {
          console.error("Failed to auto-generate allocation:", error);
          toast({
            title: "Generation Failed",
            description: "Please use the form to create your allocation manually.",
            variant: "destructive",
          });
        } finally {
          setIsGenerating(false);
        }
      }
    };

    autoGenerate();
  }, [riskAssessment, allocation, allocationLoading]);

  if (assessmentLoading || profileLoading || allocationLoading || isGenerating) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // Determine if we should show the form or the allocation
  const shouldShowForm = !allocation || showForm;

  // Check if user needs to complete risk assessment first
  if (!riskAssessment) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Smart Asset Allocation</h1>
            <p className="text-muted-foreground mt-2">
              Get a personalized portfolio recommendation based on your investment profile
            </p>
          </div>

          <Card className="border-warning">
            <CardHeader>
              <CardTitle>Complete Your Investor Profile First</CardTitle>
              <CardDescription>
                You need to complete the risk assessment questionnaire before we can generate your asset allocation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href="/assessment">Take Risk Assessment</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Smart Asset Allocation</h1>
          <p className="text-muted-foreground mt-2">
            Get a personalized portfolio recommendation based on your investment profile
          </p>
        </div>

        {shouldShowForm ? (
          <>
            {allocation && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle>Update Your Profile</CardTitle>
                  <CardDescription>
                    You already have an allocation. Create a new profile to recalculate.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
            
            <InvestorProfileForm
              riskAssessmentId={riskAssessment?.id || ""}
              onSuccess={() => {
                setShowForm(false);
                refetchAllocation();
              }}
            />
          </>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Current Allocation</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(true)}
              >
                Recalculate Allocation
              </Button>
            </div>

            {allocation && <AssetAllocationView allocation={allocation} />}
          </>
        )}
      </div>
    </div>
  );
}
