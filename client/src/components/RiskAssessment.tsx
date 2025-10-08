import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import AssessmentProgress from "./risk-assessment/AssessmentProgress";
import NavigationButtons from "./risk-assessment/NavigationButtons";
import ProfileConfirmDialog from "./risk-assessment/ProfileConfirmDialog";
import QuestionCard from "./risk-assessment/QuestionCard";
import { OPTION_SHORTCUTS, QUESTIONS } from "./risk-assessment/questions";
import { AssessmentAnswers } from "./risk-assessment/types";

interface RiskAssessmentProps {
  onComplete?: (results: any) => void;
}

export default function RiskAssessment({ onComplete }: RiskAssessmentProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>({
    lifeStage: "",
    riskTolerance: "",
    timeHorizon: "",
    geographicFocus: [
      "netherlands",
      "europe-ex-nl",
      "united-states",
      "developed-ex-us-europe",
      "emerging-markets",
    ],
    esgExclusions: [],
    incomeStability: "",
    emergencyFund: "",
    debtLevel: "",
    investmentExperience: "",
    investmentKnowledge: "",
    dividendVsGrowth: "",
    behavioralReaction: "",
    incomeRange: "",
    netWorthRange: "",
  });
  const { toast } = useToast();

  // Query to check for existing assessment
  const { data: assessment } = useQuery<{ investorProfile: any }>({
    queryKey: ["/api/risk-assessment"],
  });

  const hasExistingProfile = !!assessment?.investorProfile;

  // Auto-hide dialog and show form if no existing profile
  useEffect(() => {
    if (!hasExistingProfile) {
      setShowConfirmDialog(false);
      setShowForm(true);
    }
  }, [hasExistingProfile]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/risk-assessment", data);
      return await response.json();
    },
    onSuccess: (result) => {
      try {
        console.log("Risk assessment saved successfully:", result);
        queryClient.invalidateQueries({ queryKey: ["assessment"] });
        toast({
          title: "Assessment Complete!",
          description: "Your risk profile has been saved successfully.",
        });
        console.log("Calling onComplete with result");
        onComplete?.(result);
      } catch (error) {
        console.error("Error in onSuccess callback:", error);
        toast({
          title: "Error",
          description:
            "Assessment saved but an error occurred during completion.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Risk assessment mutation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save assessment",
        variant: "destructive",
      });
    },
  });

  const totalSteps = QUESTIONS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = useCallback(() => {
    try {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        console.log("Submitting risk assessment answers:", answers);
        const submission = {
          lifeStage: answers.lifeStage,
          riskTolerance: answers.riskTolerance,
          timeHorizon: answers.timeHorizon,
          geographicFocus: answers.geographicFocus,
          esgExclusions: answers.esgExclusions,
          incomeStability: answers.incomeStability,
          emergencyFund: answers.emergencyFund,
          debtLevel: answers.debtLevel,
          investmentExperience: answers.investmentExperience,
          investmentKnowledge: answers.investmentKnowledge,
          dividendVsGrowth: answers.dividendVsGrowth,
          behavioralReaction: answers.behavioralReaction,
          incomeRange: answers.incomeRange,
          netWorthRange: answers.netWorthRange,
        };

        console.log("Final submission object:", submission);
        mutation.mutate(submission);
      }
    } catch (error) {
      console.error("Error in handleNext:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  }, [answers, currentStep, mutation, totalSteps, toast]);

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRadioChange = useCallback(
    (value: string) => {
      const question = QUESTIONS[currentStep];
      setAnswers((prev) => ({ ...prev, [question.id]: value }));
    },
    [currentStep],
  );

  const handleCheckboxChange = useCallback(
    (value: string, checked: boolean | "indeterminate") => {
      const question = QUESTIONS[currentStep];
      const isChecked = checked === true;
      setAnswers((prev) => ({
        ...prev,
        [question.id]: isChecked
          ? [...(prev[question.id] as string[]), value]
          : (prev[question.id] as string[]).filter((v) => v !== value),
      }));
    },
    [currentStep],
  );

  const currentQuestion = QUESTIONS[currentStep];
  const isStepComplete =
    currentQuestion.id === "geographicFocus" ||
    currentQuestion.id === "esgExclusions"
      ? true // Checkboxes are always valid (can be empty)
      : answers[currentQuestion.id] !== "";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (mutation.isPending) return;

      const activeElement = document.activeElement as HTMLElement | null;
      if (activeElement) {
        const tagName = activeElement.tagName;
        const isEditable =
          tagName === "INPUT" ||
          tagName === "TEXTAREA" ||
          activeElement.isContentEditable;

        if (isEditable) {
          return;
        }
      }

      if (event.key === "Enter" || event.key === "ArrowDown") {
        if (isStepComplete) {
          event.preventDefault();
          handleNext();
        }
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        handlePrevious();
        return;
      }

      const pressedKey = event.key.toLowerCase();
      const shortcutIndex = OPTION_SHORTCUTS.findIndex(
        (shortcut) => shortcut === pressedKey,
      );

      if (shortcutIndex !== -1) {
        const option = currentQuestion.options[shortcutIndex];
        if (option) {
          event.preventDefault();
          handleRadioChange(option.value);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentQuestion,
    handleNext,
    handleRadioChange,
    isStepComplete,
    mutation.isPending,
  ]);

  // Show confirmation dialog if user has existing profile
  if (!showForm && hasExistingProfile) {
    return (
      <>
        <ProfileConfirmDialog
          open={showConfirmDialog}
          investorProfile={assessment?.investorProfile || null}
          onConfirm={() => {
            setShowConfirmDialog(false);
            setShowForm(true);
          }}
          onCancel={() => {
            setShowConfirmDialog(false);
            // Navigate back or stay on page without showing form
          }}
        />
        {!showConfirmDialog && (
          <div className="mx-auto w-full min-w-0 max-w-4xl overflow-x-hidden p-3 sm:p-6">
            <div className="text-center">
              <p className="text-muted-foreground">
                Keeping your current profile...
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl overflow-x-hidden p-3 sm:p-6">
      <AssessmentProgress currentStep={currentStep} totalSteps={totalSteps} />

      <QuestionCard
        question={currentQuestion}
        answers={answers}
        onRadioChange={handleRadioChange}
        onCheckboxChange={handleCheckboxChange}
        onAnswersChange={setAnswers}
      >
        <NavigationButtons
          currentStep={currentStep}
          totalSteps={totalSteps}
          isStepComplete={isStepComplete}
          isPending={mutation.isPending}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      </QuestionCard>
    </div>
  );
}
