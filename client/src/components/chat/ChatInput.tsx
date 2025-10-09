import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
}: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className="border-t p-4">
      <div className="flex gap-3">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask about your portfolio..."
          disabled={disabled}
          className="min-h-[44px] touch-manipulation"
          data-testid="input-chat-message"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!value.trim() || disabled}
          className="min-h-[44px] min-w-[44px] touch-manipulation"
          data-testid="button-send-message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
