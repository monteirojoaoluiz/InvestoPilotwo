import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface PortfolioChatProps {
  onSendMessage?: (message: string) => void;
}

export default function PortfolioChat({ onSendMessage }: PortfolioChatProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNewChat, setIsNewChat] = useState(false);
  const [showNewChatSuccess, setShowNewChatSuccess] = useState(false);
  const { toast } = useToast();

  const queryClient = useQueryClient();
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  // Must be declared before any early returns to keep hook order stable
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  // Fetch portfolio on mount
  const { data: portfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/portfolio');
      return res.json();
    },
  });

  useEffect(() => {
    if (portfolio?.id) {
      setPortfolioId(portfolio.id);
    }
  }, [portfolio]);

  // Hide the new chat success message after 3 seconds
  useEffect(() => {
    if (showNewChatSuccess) {
      const timer = setTimeout(() => {
        setShowNewChatSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showNewChatSuccess]);

  const { data: messagesData = [] } = useQuery({
    queryKey: ['messages', portfolioId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/portfolio/${portfolioId}/messages`);
      const data = await res.json();
      return data.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender,
        timestamp: new Date(msg.createdAt),
      })) as Message[];
    },
    enabled: !!portfolioId,
  });

  // Auto-scroll to bottom when messages update or when loading bubble shows
  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messagesData.length, optimisticMessages.length, isLoading]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest('POST', `/api/portfolio/${portfolioId}/messages`, { content });
      return res.json();
    },
    onSuccess: (data) => {
      if (!isNewChat) {
        // Normal case: invalidate to refetch all messages
        queryClient.invalidateQueries({ queryKey: ['messages', portfolioId] });
      } else {
        // New chat mode: manually update the cache with the new messages
        const currentMessages = queryClient.getQueryData(['messages', portfolioId]) || [];
        // Transform the messages to match the expected format (same as query function)
        const transformedMessages = [data.userMessage, data.aiMessage].map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender,
          timestamp: new Date(msg.createdAt),
        }));
        queryClient.setQueryData(['messages', portfolioId], [...currentMessages, ...transformedMessages]);
        setIsNewChat(false); // Exit new chat mode after first message
      }
    },
    onError: (error) => {
      console.error('Send error:', error);
    }
  });

  // If !portfolioId return loading
  if (!portfolioId) {
    if (portfolio === null) {
      return (
        <Card className="flex flex-col h-[600px]">
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Chat with Your Portfolio AI
            </h3>
            <p className="text-sm text-muted-foreground">
              No portfolio generated yet. Please complete your investor profile and generate a portfolio to start chatting.
            </p>
          </div>
          <div className="flex-1 p-4 flex items-center justify-center">
            <div className="text-center">
              <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Portfolio AI is ready when you are.</p>
            </div>
          </div>
        </Card>
      );
    }
    return <div>Loading portfolio...</div>;
  }

  const messages = [...messagesData, ...optimisticMessages];

  const handleNewChat = async () => {
    if (!portfolioId) return;

    try {
      // Delete all messages from the database
      await apiRequest('DELETE', `/api/portfolio/${portfolioId}/messages`);

      // Clear optimistic messages and input
      setOptimisticMessages([]);
      setMessage("");

      // Set the messages query data to empty array immediately
      queryClient.setQueryData(['messages', portfolioId], []);

      // Mark that we're in new chat mode to prevent query invalidation on first message
      setIsNewChat(true);

      // Show inline success message near the button
      setShowNewChatSuccess(true);
    } catch (error) {
      console.error('Error starting new chat:', error);
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

    sendMutation.mutate(message, {
      onSuccess: () => {
        setMessage("");
        setIsLoading(false);
        setOptimisticMessages([]);
      },
      onError: () => {
        setIsLoading(false);
        setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId));
      },
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Chat with Your Portfolio AI
            </h3>
            <p className="text-sm text-muted-foreground">
              Ask questions about your investments, market trends, or portfolio strategy
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewChat}
              className="flex items-center gap-2"
              data-testid="button-new-chat"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
            {showNewChatSuccess && (
              <div className="text-xs text-green-600 dark:text-green-400 font-medium animate-in fade-in-0 slide-in-from-top-1 duration-300">
                ✓ Conversation cleared
              </div>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg: Message) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "ai" && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.sender === "ai" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
                <p className={`text-xs mt-1 opacity-70`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>

              {msg.sender === "user" && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground flex-shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={scrollAnchorRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about your portfolio..."
            disabled={isLoading}
            data-testid="input-chat-message"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!message.trim() || isLoading}
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
}