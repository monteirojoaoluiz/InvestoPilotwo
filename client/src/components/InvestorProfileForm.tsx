import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateProfile, useCreateAllocation } from "@/hooks/use-allocation";
import { useToast } from "@/hooks/use-toast";

const investorProfileSchema = z.object({
  riskAssessmentId: z.string().min(1, "Risk assessment ID is required"),
  riskTolerance: z.number().min(0).max(100),
  investmentHorizon: z.number().min(1).max(100),
  riskCapacity: z.enum(["low", "medium", "high"]),
  experienceLevel: z.enum(["beginner", "intermediate", "experienced", "expert"]),
  cashOtherPreference: z.number().min(0).max(100),
});

type InvestorProfileFormData = z.infer<typeof investorProfileSchema>;

interface InvestorProfileFormProps {
  riskAssessmentId?: string;
  onSuccess?: () => void;
}

export function InvestorProfileForm({ riskAssessmentId, onSuccess }: InvestorProfileFormProps) {
  const { toast } = useToast();
  const createProfile = useCreateProfile();
  const createAllocation = useCreateAllocation();
  const [isCalculating, setIsCalculating] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InvestorProfileFormData>({
    resolver: zodResolver(investorProfileSchema),
    defaultValues: {
      riskAssessmentId: riskAssessmentId || "default-assessment",
      riskTolerance: 50,
      investmentHorizon: 10,
      riskCapacity: "medium",
      experienceLevel: "beginner",
      cashOtherPreference: 50,
    },
  });

  const riskCapacity = watch("riskCapacity");
  const experienceLevel = watch("experienceLevel");
  const riskTolerance = watch("riskTolerance");

  const onSubmit = async (data: InvestorProfileFormData) => {
    try {
      setIsCalculating(true);

      // Create the investor profile
      const profile = await createProfile.mutateAsync(data);

      toast({
        title: "Profile created",
        description: "Your investor profile has been created successfully.",
      });

      // Automatically calculate allocation
      await createAllocation.mutateAsync(profile.id);

      toast({
        title: "Allocation calculated",
        description: "Your asset allocation has been calculated.",
      });

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create profile",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investor Profile</CardTitle>
        <CardDescription>
          Tell us about your investment preferences to generate a personalized asset allocation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Risk Tolerance */}
          <div className="space-y-2">
            <Label htmlFor="riskTolerance">
              Risk Tolerance: {riskTolerance}
            </Label>
            <Input
              type="range"
              id="riskTolerance"
              min="0"
              max="100"
              {...register("riskTolerance", { valueAsNumber: true })}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              {riskTolerance < 33 && "Conservative: You prefer stability and lower risk"}
              {riskTolerance >= 33 && riskTolerance < 67 && "Moderate: You balance growth and stability"}
              {riskTolerance >= 67 && "Aggressive: You prioritize growth potential"}
            </p>
            {errors.riskTolerance && (
              <p className="text-sm text-destructive">{errors.riskTolerance.message}</p>
            )}
          </div>

          {/* Investment Horizon */}
          <div className="space-y-2">
            <Label htmlFor="investmentHorizon">Investment Horizon (Years)</Label>
            <Input
              type="number"
              id="investmentHorizon"
              {...register("investmentHorizon", { valueAsNumber: true })}
              placeholder="10"
              min="1"
              max="100"
            />
            <p className="text-sm text-muted-foreground">
              How many years until you need this money?
            </p>
            {errors.investmentHorizon && (
              <p className="text-sm text-destructive">{errors.investmentHorizon.message}</p>
            )}
          </div>

          {/* Risk Capacity */}
          <div className="space-y-2">
            <Label htmlFor="riskCapacity">Risk Capacity</Label>
            <Select
              value={riskCapacity}
              onValueChange={(value) => setValue("riskCapacity", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select risk capacity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  Low - Limited ability to handle losses
                </SelectItem>
                <SelectItem value="medium">
                  Medium - Moderate ability to handle losses
                </SelectItem>
                <SelectItem value="high">
                  High - Strong ability to handle losses
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Your financial ability to withstand investment losses
            </p>
            {errors.riskCapacity && (
              <p className="text-sm text-destructive">{errors.riskCapacity.message}</p>
            )}
          </div>

          {/* Experience Level */}
          <div className="space-y-2">
            <Label htmlFor="experienceLevel">Investment Experience</Label>
            <Select
              value={experienceLevel}
              onValueChange={(value) => setValue("experienceLevel", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select experience level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">
                  Beginner - Simple portfolio (3-5 holdings)
                </SelectItem>
                <SelectItem value="intermediate">
                  Intermediate - Balanced portfolio (5-7 holdings)
                </SelectItem>
                <SelectItem value="experienced">
                  Experienced - Diverse portfolio (7-10 holdings)
                </SelectItem>
                <SelectItem value="expert">
                  Expert - Complex portfolio (10+ holdings)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Your investment knowledge and experience level
            </p>
            {errors.experienceLevel && (
              <p className="text-sm text-destructive">{errors.experienceLevel.message}</p>
            )}
          </div>

          {/* Cash vs Other Preference */}
          <div className="space-y-2">
            <Label htmlFor="cashOtherPreference">
              Cash Preference: {watch("cashOtherPreference")}% cash
            </Label>
            <Input
              type="range"
              id="cashOtherPreference"
              min="0"
              max="100"
              {...register("cashOtherPreference", { valueAsNumber: true })}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              For non-stock/bond assets, how much should be in cash vs. other investments?
            </p>
            {errors.cashOtherPreference && (
              <p className="text-sm text-destructive">{errors.cashOtherPreference.message}</p>
            )}
          </div>

          {/* Hidden Risk Assessment ID */}
          <input type="hidden" {...register("riskAssessmentId")} />

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || isCalculating}
          >
            {isSubmitting || isCalculating ? "Calculating..." : "Generate Asset Allocation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
