import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  usePortfolioMessages,
  type Message,
} from "@/hooks/usePortfolioMessages";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Plus } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { SuggestedQuestions } from "./SuggestedQuestions";

interface PortfolioChatProps {
  onSendMessage?: (message: string) => void;
  portfolio?: any; // Add portfolio prop
}

export default function PortfolioChat({
  onSendMessage,
  portfolio,
}: PortfolioChatProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNewChat, setIsNewChat] = useState(false);
  const [showNewChatSuccess, setShowNewChatSuccess] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

  // Fetch portfolio on mount - MUST be called before any conditional returns
  const { data: portfolioData } = useQuery<{
    id: string;
    allocations: any[];
    totalValue: number;
    totalReturn: number;
  }>({
    queryKey: ["/api/portfolio"],
  });

  // Use custom hooks - MUST be called before any conditional returns
  // Pass portfolioId even if null, the hooks handle it internally
  const { data: messagesData = [] } = usePortfolioMessages(portfolioId);
  const { streamingMessage, isStreaming, sendMessageWithStreaming } =
    useStreamingChat({
      portfolioId,
      isNewChat,
      setIsNewChat,
    });

  // Compute suggested questions - useMemo is a hook, must be before returns
  const suggestedQuestions = useMemo(() => {
    try {
      if (
        !portfolio?.allocations ||
        !Array.isArray(portfolio.allocations) ||
        portfolio.allocations.length === 0
      ) {
        return ["What should I invest in as a beginner?"];
      }

      const questions = [
        "Explain my current allocation",
        "What if the market drops 20%?",
        "How can I reduce risk?",
        "Should I rebalance?",
        "What about ESG investing?",
        "How much should I invest monthly?",
        "When should I retire?",
        "What about international stocks?",
        "How to handle market volatility?",
        "What are the tax implications?",
      ];

      const bondPct = portfolio.allocations.reduce(
        (sum: number, a: any) =>
          sum + (a?.assetType === "Bonds" ? a?.percentage || 0 : 0),
        0,
      );
      const stockPct = portfolio.allocations.reduce(
        (sum: number, a: any) =>
          sum + (a?.assetType?.includes("Equity") ? a?.percentage || 0 : 0),
        0,
      );
      const esg = portfolio.allocations.some((a: any) =>
        a?.name?.includes("ESG"),
      );

      // Add personalized questions based on portfolio
      if (bondPct > 50) {
        questions.push("Why is my portfolio so conservative?");
      }
      if (stockPct > 70) {
        questions.push("How can I reduce risk in my portfolio?");
      }
      if (esg) {
        questions.push("Tell me more about the ESG focus in my investments");
      } else {
        questions.push("Should I consider ESG investments?");
      }

      return questions.slice(0, 8);
    } catch (error) {
      console.error("Error generating suggested questions:", error);
      return ["What should I invest in as a beginner?"];
    }
  }, [portfolio]);

  // Set portfolioId from data
  useEffect(() => {
    if (portfolioData?.id) {
      setPortfolioId(portfolioData.id);
    }
  }, [portfolioData]);

  // Hide the new chat success message after 3 seconds
  useEffect(() => {
    if (showNewChatSuccess) {
      const timer = setTimeout(() => {
        setShowNewChatSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showNewChatSuccess]);

  // Compute messages - must be before early returns
  const messages = [...messagesData, ...optimisticMessages];

  // Auto-scroll to bottom when new messages arrive or streaming updates
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, streamingMessage, isStreaming]);

  // NOW we can do early returns after all hooks are called
  // If !portfolioId return loading
  if (!portfolioId) {
    if (portfolioData === null) {
      return (
        <Card className="flex h-[600px] flex-col">
          <div className="border-b p-4">
            <h3 className="flex items-center gap-2 font-semibold">
              <Bot className="h-5 w-5 text-primary" />
              Chat with Your Portfolio AI
            </h3>
            <p className="text-sm text-muted-foreground">
              No portfolio generated yet. Please complete your investor profile
              and generate a portfolio to start chatting.
            </p>
          </div>
          <div className="flex flex-1 items-center justify-center p-4">
            <div className="text-center">
              <Bot className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                Portfolio AI is ready when you are.
              </p>
            </div>
          </div>
        </Card>
      );
    }
    return <div>Loading portfolio...</div>;
  }

  const handleNewChat = async () => {
    if (!portfolioId) return;

    try {
      // Delete all messages from the database
      await apiRequest("DELETE", `/api/portfolio/${portfolioId}/messages`);

      // Clear optimistic messages and input
      setOptimisticMessages([]);
      setMessage("");

      // Set the messages query data to empty array immediately
      queryClient.setQueryData(["messages", portfolioId], []);

      // Mark that we're in new chat mode to prevent query invalidation on first message
      setIsNewChat(true);

      // Show inline success message near the button
      setShowNewChatSuccess(true);
    } catch (error) {
      console.error("Error starting new chat:", error);
      toast({
        title: "Error",
        description: "Failed to start new chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || !portfolioId) return;

    // Optimistically add user message immediately
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      content: message,
      sender: "user",
      timestamp: new Date(),
    };
    setOptimisticMessages((prev) => [...prev, optimistic]);
    setIsLoading(true);

    const currentMessage = message;
    setMessage("");

    try {
      await sendMessageWithStreaming(currentMessage);
      setIsLoading(false);
      setOptimisticMessages([]);
    } catch (error) {
      setIsLoading(false);
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId));
      setMessage(currentMessage); // Restore message on error
    }
  };

  // Handle suggested question click - auto-send the question
  const handleSuggestedQuestionClick = async (question: string) => {
    if (isLoading || !portfolioId) return;

    // Optimistically add user message immediately
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      content: question,
      sender: "user",
      timestamp: new Date(),
    };
    setOptimisticMessages((prev) => [...prev, optimistic]);
    setIsLoading(true);

    try {
      await sendMessageWithStreaming(question);
      setIsLoading(false);
      setOptimisticMessages([]);
    } catch (error) {
      setIsLoading(false);
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  return (
    <Card className="flex h-[600px] w-full min-w-0 max-w-full flex-col">
      <div className="border-b p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          <div className="min-w-0 flex-1">
            <h3 className="flex items-center gap-2 text-base font-semibold sm:text-lg">
              <Bot className="h-5 w-5 flex-shrink-0 text-primary" />
              <span className="truncate">Chat with Your Portfolio AI</span>
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask questions about your investments, market trends, or portfolio
              strategy
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:flex-shrink-0 sm:items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewChat}
              className="flex min-h-[36px] w-full touch-manipulation items-center gap-2 sm:w-auto"
              data-testid="button-new-chat"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
            {showNewChatSuccess && (
              <div className="text-xs font-medium text-green-600 duration-300 animate-in fade-in-0 slide-in-from-top-1 dark:text-green-400">
                ✓ Conversation cleared
              </div>
            )}
          </div>
        </div>
      </div>

      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg: Message) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {/* Streaming AI message */}
          {isStreaming && streamingMessage && (
            <div className="flex justify-start gap-3 duration-200 animate-in fade-in">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="max-w-[85%] rounded-lg bg-muted p-3 sm:max-w-[80%]">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamingMessage}
                  </ReactMarkdown>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <div
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {isLoading && !isStreaming && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="flex gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <SuggestedQuestions
        questions={suggestedQuestions}
        onQuestionClick={handleSuggestedQuestionClick}
        disabled={isLoading}
      />

      <ChatInput
        value={message}
        onChange={setMessage}
        onSubmit={handleSendMessage}
        disabled={isLoading}
      />
    </Card>
  );
}
