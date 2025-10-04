import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AssessmentAnswers = {
  lifeStage: string;
  riskTolerance: string;
  timeHorizon: string;
  usOnly: string;
  esgOnly: string;
  incomeStability: string;
  emergencyFund: string;
  debtLevel: string;
  investmentExperience: string;
  investmentKnowledge: string;
  behavioralReaction: string;
  incomeRange: string;
  netWorthRange: string;
};

type RadioOption = {
  value: string;
  label: string;
};

type Question = {
  id: keyof AssessmentAnswers;
  title: string;
  description: string;
  options: RadioOption[];
};

interface RiskAssessmentProps {
  onComplete?: (results: any) => void;
}

const OPTION_SHORTCUTS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

const QUESTIONS: Question[] = [
  {
    id: "lifeStage",
    title: "Where are you in your financial journey?",
    description: "This helps us tailor recommendations to match your current priorities.",
    options: [
      { value: "early-career", label: "I'm early in my career and building wealth" },
      { value: "mid-career", label: "I'm mid-career and focused on growing assets" },
      { value: "nearing-retirement", label: "I'm within 10 years of retirement" },
      { value: "retired", label: "I'm retired and prioritising income stability" },
    ],
  },
  {
    id: "riskTolerance",
    title: "How do you feel about market ups and downs?",
    description: "Your comfort with volatility guides the mix of conservative vs growth assets.",
    options: [
      { value: "conservative", label: "I'd rather avoid big drops, even if returns are lower" },
      { value: "moderate", label: "I'm okay with some swings for balanced growth" },
      { value: "aggressive", label: "I'm comfortable with larger swings for higher potential returns" },
    ],
  },
  {
    id: "timeHorizon",
    title: "When will you likely need to use this money?",
    description: "A longer horizon allows us to take on more growth-oriented investments.",
    options: [
      { value: "under-3-years", label: "Within 3 years" },
      { value: "three-to-seven-years", label: "In about 3-7 years" },
      { value: "over-seven-years", label: "In more than 7 years" },
    ],
  },
  {
    id: "usOnly",
    title: "Should we focus only on US-based investments?",
    description: "Let us know if you'd prefer to avoid international exposure.",
    options: [
      { value: "yes", label: "Yes, keep my portfolio US-focused" },
      { value: "no", label: "No, include international opportunities" },
    ],
  },
  {
    id: "esgOnly",
    title: "How important are environmental or social impact considerations?",
    description: "We can favour ESG-focused funds if this matters to you.",
    options: [
      { value: "yes", label: "Prioritise ESG-friendly investments" },
      { value: "no", label: "Standard investment options are fine" },
    ],
  },
  {
    id: "incomeStability",
    title: "How stable do you expect your income to be over the next 5 years?",
    description: "Income stability affects how much risk we can take with your investments.",
    options: [
      { value: "very-stable", label: "Very stable (e.g., government job, tenure)" },
      { value: "somewhat-stable", label: "Somewhat stable (steady industry)" },
      { value: "unstable", label: "Potentially unstable (commission-based, startup)" },
    ],
  },
  {
    id: "emergencyFund",
    title: "Do you have an emergency fund?",
    description: "An emergency fund provides a safety net, allowing for more aggressive investing.",
    options: [
      { value: "yes", label: "Yes, 3-6+ months of expenses" },
      { value: "partial", label: "Partial (1-3 months)" },
      { value: "no", label: "No emergency fund" },
    ],
  },
  {
    id: "debtLevel",
    title: "What is your current debt situation?",
    description: "High-interest debt may require more conservative investment strategies.",
    options: [
      { value: "low-none", label: "Low or no debt" },
      { value: "manageable", label: "Manageable debt (mortgage, student loans)" },
      { value: "high", label: "High-interest debt (credit cards)" },
    ],
  },
  {
    id: "investmentExperience",
    title: "How would you describe your investment experience?",
    description: "Your experience level helps us match complexity to your comfort.",
    options: [
      { value: "none", label: "No experience" },
      { value: "beginner", label: "Beginner (a few years)" },
      { value: "intermediate", label: "Intermediate (diversified portfolio)" },
      { value: "advanced", label: "Advanced (active management)" },
    ],
  },
  {
    id: "investmentKnowledge",
    title: "How knowledgeable are you about investing?",
    description: "This helps us provide appropriate educational resources.",
    options: [
      { value: "beginner", label: "Beginner (learning basics)" },
      { value: "intermediate", label: "Intermediate (understand diversification)" },
      { value: "advanced", label: "Advanced (technical analysis, etc.)" },
    ],
  },
  {
    id: "behavioralReaction",
    title: "If your portfolio dropped 20% in a year, what would you do?",
    description: "Your likely reaction helps assess behavioral risk tolerance.",
    options: [
      { value: "sell-all", label: "Sell everything to stop the losses" },
      { value: "sell-some", label: "Sell some to reduce exposure" },
      { value: "hold", label: "Hold and wait for recovery" },
      { value: "buy-more", label: "Buy more (buy the dip)" },
    ],
  },
  {
    id: "incomeRange",
    title: "Approximate annual household income?",
    description: "This helps contextualize your investment capacity.",
    options: [
      { value: "<50k", label: "Under $50,000" },
      { value: "50-100k", label: "$50,000 - $100,000" },
      { value: "100-250k", label: "$100,000 - $250,000" },
      { value: "250k+", label: "$250,000+" },
    ],
  },
  {
    id: "netWorthRange",
    title: "Approximate net worth (excluding primary residence)?",
    description: "This provides context for diversification needs.",
    options: [
      { value: "<100k", label: "Under $100,000" },
      { value: "100-500k", label: "$100,000 - $500,000" },
      { value: "500k-1M", label: "$500,000 - $1,000,000" },
      { value: "1M+", label: "$1,000,000+" },
    ],
  },
];

export default function RiskAssessment({ onComplete }: RiskAssessmentProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>({
    lifeStage: "",
    riskTolerance: "",
    timeHorizon: "",
    usOnly: "",
    esgOnly: "",
    incomeStability: "",
    emergencyFund: "",
    debtLevel: "",
    investmentExperience: "",
    investmentKnowledge: "",
    behavioralReaction: "",
    incomeRange: "",
    netWorthRange: "",
  });
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/risk-assessment", data);
      return await response.json();
    },
    onSuccess: (result) => {
      try {
        console.log('Risk assessment saved successfully:', result);
        queryClient.invalidateQueries({ queryKey: ["assessment"] });
        toast({
          title: "Assessment Complete!",
          description: "Your risk profile has been saved successfully.",
        });
        console.log('Calling onComplete with result');
        onComplete?.(result);
      } catch (error) {
        console.error('Error in onSuccess callback:', error);
        toast({
          title: "Error",
          description: "Assessment saved but an error occurred during completion.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('Risk assessment mutation error:', error);
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
        console.log('Submitting risk assessment answers:', answers);
        const submission = {
          lifeStage: answers.lifeStage,
          riskTolerance: answers.riskTolerance,
          timeHorizon: answers.timeHorizon,
          usOnly: answers.usOnly === "yes",
          esgOnly: answers.esgOnly === "yes",
          incomeStability: answers.incomeStability,
          emergencyFund: answers.emergencyFund,
          debtLevel: answers.debtLevel,
          investmentExperience: answers.investmentExperience,
          investmentKnowledge: answers.investmentKnowledge,
          behavioralReaction: answers.behavioralReaction,
          incomeRange: answers.incomeRange,
          netWorthRange: answers.netWorthRange,
        };

        console.log('Final submission object:', submission);
        mutation.mutate(submission);
      }
    } catch (error) {
      console.error('Error in handleNext:', error);
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

  const handleRadioChange = useCallback((value: string) => {
    const question = QUESTIONS[currentStep];
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  }, [currentStep]);

  const currentQuestion = QUESTIONS[currentStep];
  const isStepComplete = answers[currentQuestion.id] !== "";

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
        (shortcut) => shortcut === pressedKey
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
  }, [currentQuestion, handleNext, handleRadioChange, isStepComplete, mutation.isPending]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Investor Profile</h1>
          <span className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {totalSteps}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{currentQuestion.title}</CardTitle>
          <CardDescription>{currentQuestion.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={answers[currentQuestion.id]} onValueChange={handleRadioChange}>
            {currentQuestion.options.map((option, index) => {
              const shortcut = OPTION_SHORTCUTS[index];

              return (
                <div key={option.value} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/50 touch-manipulation">
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="mt-1"
                    data-testid={`radio-${option.value}`}
                  />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer leading-relaxed py-1">
                    {shortcut && (
                      <span className="mr-2 text-sm font-medium text-muted-foreground">
                        ({shortcut})
                      </span>
                    )}
                    {option.label}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>

          <div className="flex justify-between pt-6 gap-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              size="lg"
              className="flex-1 min-h-[44px] touch-manipulation"
              data-testid="button-previous"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Previous
            </Button>

            <Button
              onClick={handleNext}
              disabled={!isStepComplete || mutation.isPending}
              size="lg"
              className="flex-1 min-h-[44px] touch-manipulation"
              data-testid="button-next"
            >
                {mutation.isPending ? "Saving..." : currentStep === totalSteps - 1 ? "Complete Profile" : "Next"}
              {currentStep < totalSteps - 1 && !mutation.isPending && <ChevronRight className="w-5 h-5 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
