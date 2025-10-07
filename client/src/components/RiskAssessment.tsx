import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AssessmentAnswers = {
  lifeStage: string;
  riskTolerance: string;
  timeHorizon: string;
  geographicFocus: string[];
  esgExclusions: string[];
  incomeStability: string;
  emergencyFund: string;
  debtLevel: string;
  investmentExperience: string;
  investmentKnowledge: string;
  dividendVsGrowth: string;
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
    id: "geographicFocus",
    title: "Which geographic regions interest you most for investments?",
    description: "Select your preferred geographic focus for your investment portfolio.",
    options: [
      { value: "netherlands", label: "Netherlands (NL)" },
      { value: "europe-ex-nl", label: "Europe (ex-NL)" },
      { value: "united-states", label: "United States (US)" },
      { value: "developed-ex-us-europe", label: "Developed Markets ex-US & ex-Europe (Canada, Japan, Australia/New Zealand, Singapore/Hong Kong, Israel)" },
      { value: "emerging-markets", label: "Emerging Markets (China, India, Latin America, EMEA, Southeast Asia)" },
    ],
  },
  {
    id: "esgExclusions",
    title: "Is it okay for your portfolio to include the following?",
    description: "Uncheck any you want to exclude. Leaving all checked means no exclusions. Exclusions may reduce diversification and affect returns.",
    options: [
      { value: "tobacco", label: "Tobacco" },
      { value: "fossil-fuels", label: "Fossil fuels" },
      { value: "defense-industry", label: "Defense industry" },
      { value: "gambling", label: "Gambling" },
      { value: "adult-entertainment", label: "Adult entertainment" },
      { value: "non-esg-funds", label: "Funds without a sustainability focus (no ESG screening)" },
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
    id: "dividendVsGrowth",
    title: "Do you prefer dividend income or capital growth?",
    description: "This helps us align your portfolio with your income needs and growth objectives.",
    options: [
      { value: "dividend-focus", label: "Dividend-focused (regular income payments)" },
      { value: "balanced", label: "Balanced (some income and some growth)" },
      { value: "growth-focus", label: "Growth-focused (capital appreciation)" },
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
    geographicFocus: ["netherlands", "europe-ex-nl", "united-states", "developed-ex-us-europe", "emerging-markets"],
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

  const handleCheckboxChange = useCallback((value: string, checked: boolean | "indeterminate") => {
    const question = QUESTIONS[currentStep];
    const isChecked = checked === true;
    setAnswers((prev) => ({
      ...prev,
      [question.id]: isChecked
        ? [...(prev[question.id] as string[]), value]
        : (prev[question.id] as string[]).filter((v) => v !== value)
    }));
  }, [currentStep]);

  const currentQuestion = QUESTIONS[currentStep];
  const isStepComplete = currentQuestion.id === "geographicFocus" || currentQuestion.id === "esgExclusions"
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
    <div className="max-w-4xl mx-auto p-3 sm:p-6 w-full min-w-0 overflow-x-hidden">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold">Investor Profile</h1>
          <span className="text-base sm:text-lg text-muted-foreground font-medium">
            Step {currentStep + 1} of {totalSteps}
          </span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      <Card className="shadow-lg">
        <CardHeader className="pb-6 sm:pb-8 px-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl leading-tight pr-0">{currentQuestion.title}</CardTitle>
          <CardDescription className="text-base sm:text-lg leading-relaxed text-muted-foreground mt-2">{currentQuestion.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 pt-0 px-4 sm:px-6">
          {currentQuestion.id === "geographicFocus" || currentQuestion.id === "esgExclusions" ? (
            <div className="grid grid-cols-1 gap-4 sm:gap-5">
              {currentQuestion.options.map((option, index) => {
                const shortcut = OPTION_SHORTCUTS[index];
                // For esgExclusions, checked means NOT excluded (inverted logic)
                // For geographicFocus, checked means included
                const isChecked = currentQuestion.id === "esgExclusions"
                  ? !(answers[currentQuestion.id] as string[]).includes(option.value)
                  : (answers[currentQuestion.id] as string[]).includes(option.value);

                return (
                  <div key={option.value} className="flex items-center space-x-4 p-4 sm:p-5 hover:bg-muted/30 touch-manipulation rounded-xl min-h-[64px] border border-border hover:border-primary/20 transition-all duration-200 bg-card">
                    <Checkbox
                      id={option.value}
                      checked={isChecked}
                      onCheckedChange={(checked: boolean | "indeterminate") => {
                        // For esgExclusions, unchecking means add to exclusions list
                        if (currentQuestion.id === "esgExclusions") {
                          const isNowChecked = checked === true;
                          setAnswers((prev) => ({
                            ...prev,
                            [currentQuestion.id]: isNowChecked
                              ? (prev[currentQuestion.id] as string[]).filter((v) => v !== option.value)
                              : [...(prev[currentQuestion.id] as string[]), option.value]
                          }));
                        } else {
                          handleCheckboxChange(option.value, checked);
                        }
                      }}
                      data-testid={`checkbox-${option.value}`}
                      className="flex-shrink-0 min-h-[24px] min-w-[24px] mt-0.5"
                    />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer leading-relaxed text-base sm:text-lg font-medium py-2">
                      <div className="flex items-center gap-3">
                        {shortcut && (
                          <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-full min-w-[28px] text-center">
                            {shortcut}
                          </span>
                        )}
                        <span className="text-foreground">{option.label}</span>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </div>
          ) : (
            <RadioGroup value={answers[currentQuestion.id]} onValueChange={handleRadioChange}>
              <div className="grid grid-cols-1 gap-4 sm:gap-5">
                {currentQuestion.options.map((option, index) => {
                  const shortcut = OPTION_SHORTCUTS[index];

                  return (
                    <div key={option.value} className="flex items-center space-x-4 p-4 sm:p-5 hover:bg-muted/30 touch-manipulation rounded-xl min-h-[64px] border border-border hover:border-primary/20 transition-all duration-200 bg-card">
                      <RadioGroupItem
                        value={option.value}
                        id={option.value}
                        data-testid={`radio-${option.value}`}
                        className="flex-shrink-0 min-h-[24px] min-w-[24px] mt-0.5"
                      />
                      <Label htmlFor={option.value} className="flex-1 cursor-pointer leading-relaxed text-base sm:text-lg font-medium py-2">
                        <div className="flex items-center gap-3">
                          {shortcut && (
                            <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-full min-w-[28px] text-center">
                              {shortcut}
                            </span>
                          )}
                          <span className="text-foreground">{option.label}</span>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          )}

          <div className="flex flex-col sm:flex-row justify-between pt-8 sm:pt-10 gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              size="lg"
              className="flex-1 min-h-[56px] touch-manipulation order-2 sm:order-1 text-lg font-semibold"
              data-testid="button-previous"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Previous
            </Button>

            <Button
              onClick={handleNext}
              disabled={!isStepComplete || mutation.isPending}
              size="lg"
              className="flex-1 min-h-[56px] touch-manipulation order-1 sm:order-2 text-lg font-semibold"
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
