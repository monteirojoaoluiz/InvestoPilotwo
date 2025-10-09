import { Button } from "@/components/ui/button";

interface SuggestedQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
  disabled?: boolean;
}

export function SuggestedQuestions({
  questions,
  onQuestionClick,
  disabled = false,
}: SuggestedQuestionsProps) {
  return (
    <div className="relative overflow-hidden border-t p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Suggested questions
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="hidden sm:inline">Swipe horizontally</span>
          <span className="sm:hidden">← Swipe →</span>
        </span>
      </div>
      <div className="relative">
        <div
          className="suggested-questions-container scrollbar-hide -mx-4 flex gap-2 overflow-x-auto overflow-y-hidden px-4 pb-2 [&::-webkit-scrollbar]:hidden"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollBehavior: "smooth",
            overscrollBehaviorX: "contain",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            touchAction: "pan-x",
            scrollSnapType: "x mandatory",
            minHeight: "56px",
            maxHeight: "120px",
          }}
        >
          {questions.map((q, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              onClick={() => onQuestionClick(q)}
              disabled={disabled}
              className="scroll-snap-align-start h-auto min-w-fit flex-shrink-0 touch-manipulation whitespace-nowrap rounded-full border-primary/20 px-4 py-3 text-xs transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 active:scale-95 sm:px-5 sm:text-sm"
              style={{
                minHeight: "48px",
                minWidth: "max-content",
                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: "manipulation",
              }}
            >
              {q}
            </Button>
          ))}

          {/* Add padding at the end for better scrolling experience */}
          <div className="w-1 flex-shrink-0"></div>
        </div>
      </div>
    </div>
  );
}
