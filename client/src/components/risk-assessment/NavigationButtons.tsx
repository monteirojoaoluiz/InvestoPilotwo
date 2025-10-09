import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  isStepComplete: boolean;
  isPending: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export default function NavigationButtons({
  currentStep,
  totalSteps,
  isStepComplete,
  isPending,
  onPrevious,
  onNext,
}: NavigationButtonsProps) {
  return (
    <div className="flex flex-col justify-between gap-4 pt-8 sm:flex-row sm:pt-10">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 0}
        size="lg"
        className="order-2 min-h-[56px] flex-1 touch-manipulation text-lg font-semibold sm:order-1"
        data-testid="button-previous"
      >
        <ChevronLeft className="mr-2 h-5 w-5" />
        Previous
      </Button>

      <Button
        onClick={onNext}
        disabled={!isStepComplete || isPending}
        size="lg"
        className="order-1 min-h-[56px] flex-1 touch-manipulation text-lg font-semibold sm:order-2"
        data-testid="button-next"
      >
        {isPending
          ? "Saving..."
          : currentStep === totalSteps - 1
            ? "Complete Profile"
            : "Next"}
        {currentStep < totalSteps - 1 && !isPending && (
          <ChevronRight className="ml-2 h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
