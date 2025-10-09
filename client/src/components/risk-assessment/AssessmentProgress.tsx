import { Progress } from "@/components/ui/progress";

interface AssessmentProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function AssessmentProgress({
  currentStep,
  totalSteps,
}: AssessmentProgressProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="mb-6 sm:mb-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold sm:text-3xl">Investor Profile</h1>
        <span className="text-base font-medium text-muted-foreground sm:text-lg">
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>
      <Progress value={progress} className="h-3" />
    </div>
  );
}
