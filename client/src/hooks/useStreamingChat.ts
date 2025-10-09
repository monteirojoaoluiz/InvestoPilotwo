import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import type { Message } from "./usePortfolioMessages";

// Helper function to add delay between chunks for smoother streaming
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface UseStreamingChatProps {
  portfolioId: string | null;
  isNewChat: boolean;
  setIsNewChat: (value: boolean) => void;
}

export function useStreamingChat({
  portfolioId,
  isNewChat,
  setIsNewChat,
}: UseStreamingChatProps) {
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sendMessageWithStreaming = async (content: string) => {
    try {
      const response = await fetch(`/api/portfolio/${portfolioId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No reader available");
      }

      let userMessageData: any = null;
      let accumulatedContent = "";
      setIsStreaming(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "userMessage") {
                userMessageData = data.data;
              } else if (data.type === "chunk") {
                accumulatedContent += data.data;
                setStreamingMessage(accumulatedContent);
                // Add a small delay to slow down the streaming effect (5ms per chunk)
                await delay(5);
              } else if (data.type === "complete") {
                // Message complete, update query data directly
                setIsStreaming(false);
                setStreamingMessage("");

                if (isNewChat) {
                  // For new chat, append the new messages to existing data
                  const currentMessages =
                    (queryClient.getQueryData(["messages", portfolioId]) as
                      | Message[]
                      | undefined) || [];
                  const transformedMessages = [
                    {
                      id: userMessageData.id,
                      content: userMessageData.content,
                      sender: userMessageData.sender,
                      timestamp: new Date(userMessageData.createdAt),
                    },
                    {
                      id: data.data.id,
                      content: data.data.content,
                      sender: data.data.sender,
                      timestamp: new Date(data.data.createdAt),
                    },
                  ] as Message[];
                  queryClient.setQueryData(
                    ["messages", portfolioId],
                    [...currentMessages, ...transformedMessages],
                  );
                  setIsNewChat(false);
                } else {
                  // For existing chat, append the new messages to existing data
                  const currentMessages =
                    (queryClient.getQueryData(["messages", portfolioId]) as
                      | Message[]
                      | undefined) || [];
                  const transformedMessages = [
                    {
                      id: userMessageData.id,
                      content: userMessageData.content,
                      sender: userMessageData.sender,
                      timestamp: new Date(userMessageData.createdAt),
                    },
                    {
                      id: data.data.id,
                      content: data.data.content,
                      sender: data.data.sender,
                      timestamp: new Date(data.data.createdAt),
                    },
                  ] as Message[];
                  queryClient.setQueryData(
                    ["messages", portfolioId],
                    [...currentMessages, ...transformedMessages],
                  );
                }
              } else if (data.type === "error") {
                throw new Error(data.data.message);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setIsStreaming(false);
      setStreamingMessage("");
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    streamingMessage,
    isStreaming,
    sendMessageWithStreaming,
  };
}
