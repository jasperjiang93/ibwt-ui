"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Message {
  id: string;
  role: "user" | "agent" | "system";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface AgentChatSSEProps {
  sseUrl: string;
  sessionToken: string;
  agentName: string;
  onSessionEnd?: () => void;
}

export function AgentChatSSE({
  sseUrl,
  sessionToken,
  agentName,
  onSessionEnd,
}: AgentChatSSEProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Connect to SSE
  useEffect(() => {
    const url = `${sseUrl}?token=${sessionToken}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      addSystemMessage("Connected to agent");
    };

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      setIsConnected(false);
      addSystemMessage("Connection lost. Reconnecting...");
    };

    // Handle different event types
    eventSource.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      handleAgentMessage(data);
    });

    eventSource.addEventListener("stream_start", () => {
      setIsAgentTyping(true);
      setStreamingContent("");
    });

    eventSource.addEventListener("stream_chunk", (event) => {
      const data = JSON.parse(event.data);
      setStreamingContent((prev) => prev + data.content);
    });

    eventSource.addEventListener("stream_end", () => {
      setIsAgentTyping(false);
      // Convert streaming content to final message
      if (streamingContent) {
        addAgentMessage(streamingContent);
        setStreamingContent("");
      }
    });

    eventSource.addEventListener("task_complete", (event) => {
      const data = JSON.parse(event.data);
      addSystemMessage("Task completed!");
      onSessionEnd?.();
    });

    eventSource.addEventListener("error_message", (event) => {
      const data = JSON.parse(event.data);
      addSystemMessage(`Error: ${data.message}`);
    });

    return () => {
      eventSource.close();
    };
  }, [sseUrl, sessionToken]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const addSystemMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "system",
        content,
        timestamp: new Date(),
      },
    ]);
  };

  const addAgentMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "agent",
        content,
        timestamp: new Date(),
      },
    ]);
  };

  const handleAgentMessage = (data: any) => {
    if (data.type === "message") {
      addAgentMessage(data.content);
    } else if (data.type === "progress") {
      // Handle progress update
      addSystemMessage(`Progress: ${data.progress}% - ${data.status}`);
    }
  };

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || !isConnected) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Send to agent via POST (SSE is receive-only)
    try {
      await fetch(`${sseUrl}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ content: userMessage.content }),
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      addSystemMessage("Failed to send message");
    }
  }, [inputValue, isConnected, sseUrl, sessionToken]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[500px] border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <span className="font-semibold">{agentName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-xs text-gray-400">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming message */}
        {isAgentTyping && streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-gray-800 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">🤖 {agentName}</span>
              </div>
              <div className="text-sm whitespace-pre-wrap">
                {streamingContent}
                <span className="animate-pulse">▊</span>
              </div>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {isAgentTyping && !streamingContent && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-xl px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            disabled={!isConnected}
            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || !isConnected}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === "system") {
    return (
      <div className="text-center">
        <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-xl p-3 ${
          isUser ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-100"
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">🤖 Agent</span>
          </div>
        )}
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        <div
          className={`text-xs mt-1 ${
            isUser ? "text-purple-200" : "text-gray-500"
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
