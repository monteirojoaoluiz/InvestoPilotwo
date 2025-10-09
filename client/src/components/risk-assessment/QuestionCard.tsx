import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { OPTION_SHORTCUTS } from "./questions";
import { Question, AssessmentAnswers } from "./types";

interface QuestionCardProps {
  question: Question;
  answers: AssessmentAnswers;
  onRadioChange: (value: string) => void;
  onCheckboxChange: (value: string, checked: boolean | "indeterminate") => void;
  onAnswersChange: (answers: AssessmentAnswers) => void;
  children?: React.ReactNode;
}

export default function QuestionCard({
  question,
  answers,
  onRadioChange,
  onCheckboxChange,
  onAnswersChange,
  children,
}: QuestionCardProps) {
  const isCheckboxQuestion =
    question.id === "geographicFocus" || question.id === "esgExclusions";

  return (
    <Card className="shadow-lg">
      <CardHeader className="px-4 pb-6 sm:px-6 sm:pb-8">
        <CardTitle className="pr-0 text-xl leading-tight sm:text-2xl">
          {question.title}
        </CardTitle>
        <CardDescription className="mt-2 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {question.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pt-0 sm:space-y-6 sm:px-6">
        {isCheckboxQuestion ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-5">
            {question.options.map((option, index) => {
              const shortcut = OPTION_SHORTCUTS[index];
              // For esgExclusions, checked means NOT excluded (inverted logic)
              // For geographicFocus, checked means included
              const isChecked =
                question.id === "esgExclusions"
                  ? !(answers[question.id] as string[]).includes(option.value)
                  : (answers[question.id] as string[]).includes(option.value);

              return (
                <div
                  key={option.value}
                  className="flex min-h-[64px] touch-manipulation items-center space-x-4 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/20 hover:bg-muted/30 sm:p-5"
                >
                  <Checkbox
                    id={option.value}
                    checked={isChecked}
                    onCheckedChange={(checked: boolean | "indeterminate") => {
                      // For esgExclusions, unchecking means add to exclusions list
                      if (question.id === "esgExclusions") {
                        const isNowChecked = checked === true;
                        onAnswersChange({
                          ...answers,
                          [question.id]: isNowChecked
                            ? (answers[question.id] as string[]).filter(
                                (v) => v !== option.value,
                              )
                            : [
                                ...(answers[question.id] as string[]),
                                option.value,
                              ],
                        });
                      } else {
                        onCheckboxChange(option.value, checked);
                      }
                    }}
                    data-testid={`checkbox-${option.value}`}
                    className="mt-0.5 min-h-[24px] min-w-[24px] flex-shrink-0"
                  />
                  <Label
                    htmlFor={option.value}
                    className="flex-1 cursor-pointer py-2 text-base font-medium leading-relaxed sm:text-lg"
                  >
                    <div className="flex items-center gap-3">
                      {shortcut && (
                        <span className="min-w-[28px] rounded-full bg-primary/10 px-2 py-1 text-center text-sm font-bold text-primary">
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
          <RadioGroup
            value={answers[question.id] as string}
            onValueChange={onRadioChange}
          >
            <div className="grid grid-cols-1 gap-4 sm:gap-5">
              {question.options.map((option, index) => {
                const shortcut = OPTION_SHORTCUTS[index];

                return (
                  <div
                    key={option.value}
                    className="flex min-h-[64px] touch-manipulation items-center space-x-4 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/20 hover:bg-muted/30 sm:p-5"
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      data-testid={`radio-${option.value}`}
                      className="mt-0.5 min-h-[24px] min-w-[24px] flex-shrink-0"
                    />
                    <Label
                      htmlFor={option.value}
                      className="flex-1 cursor-pointer py-2 text-base font-medium leading-relaxed sm:text-lg"
                    >
                      <div className="flex items-center gap-3">
                        {shortcut && (
                          <span className="min-w-[28px] rounded-full bg-primary/10 px-2 py-1 text-center text-sm font-bold text-primary">
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
        {children}
      </CardContent>
    </Card>
  );
}
