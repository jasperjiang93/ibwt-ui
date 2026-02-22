"use client";

import { useState, useEffect, useRef } from "react";
import { IconSend, IconSparkles } from "@/components/icons";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface RequestFrame {
  type: "req";
  id: string;
  method: string;
  params?: any;
}

interface ResponseFrame {
  type: "res";
  id: string;
  ok: boolean;
  payload?: any;
  error?: any;
}

interface EventFrame {
  type: "event";
  event: string;
  seq?: number;
  payload?: any;
}

type GatewayFrame = RequestFrame | ResponseFrame | EventFrame;

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

interface TaskAIChatPanelProps {
  taskContext: any;
}

export function TaskAIChatPanel({ taskContext }: TaskAIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionKey] = useState(`agent:task-assistant:${Date.now()}`);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingRequests = useRef<Map<string, { resolve: (payload: any) => void; reject: (err: Error) => void }>>(new Map());
  const hasInitialized = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Build system prompt with task context
  const buildSystemPrompt = () => {
    const { task, bids, acceptedBid, results } = taskContext;

    return `You are an AI assistant for IBWT. Help the user with this task:
- Request: "${task.request}"
- Budget: ${task.budgetIbwt} IBWT
- Status: ${task.status}
- Bids: ${bids?.length || 0} received${acceptedBid ? `, accepted: ${acceptedBid.agent?.name}` : ""}
${results?.length > 0 ? "- Results submitted for review" : ""}

Be concise and helpful. Focus on insights, not repeating visible info.`;
  };

  // Connect to OpenClaw WebSocket
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_OPENCLAW_WS_URL || "ws://localhost:18789";
    const token = process.env.NEXT_PUBLIC_OPENCLAW_TOKEN || "";
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    console.log("🔌 [TaskAIChatPanel] Connecting to OpenClaw...");

    // Request helper
    function request(method: string, params?: any): Promise<any> {
      return new Promise((resolve, reject) => {
        if (ws.readyState !== WebSocket.OPEN) {
          reject(new Error("WebSocket not connected"));
          return;
        }

        const id = generateId();
        const frame: RequestFrame = { type: "req", id, method, params };

        pendingRequests.current.set(id, { resolve, reject });

        setTimeout(() => {
          if (pendingRequests.current.has(id)) {
            pendingRequests.current.delete(id);
            reject(new Error(`Request timeout: ${method}`));
          }
        }, 30000);

        ws.send(JSON.stringify(frame));
      });
    }

    ws.onopen = () => {
      console.log("✅ [TaskAIChatPanel] Connected to OpenClaw Gateway");
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const frame: GatewayFrame = JSON.parse(event.data);

        if (frame.type === "res") {
          // Handle response
          const { resolve, reject } = pendingRequests.current.get(frame.id) || {};
          if (resolve && reject) {
            pendingRequests.current.delete(frame.id);
            if (frame.ok) {
              resolve(frame.payload);
            } else {
              reject(new Error(frame.error?.message || "Request failed"));
            }
          }
        } else if (frame.type === "event") {
          switch (frame.event) {
            case "connect.challenge":
              console.log("🔐 Received challenge, authenticating...");
              request("connect", {
                minProtocol: 3,
                maxProtocol: 3,
                client: {
                  id: "test",
                  displayName: "IBWT Task Assistant",
                  version: "1.0.0",
                  platform: "web",
                  mode: "test",
                },
                caps: [],
                auth: {
                  token: token,
                },
              })
                .then((helloOk) => {
                  console.log("✅ Authentication successful:", helloOk);
                  setIsAuthenticated(true);

                  if (!hasInitialized.current) {
                    setMessages([
                      {
                        role: "system",
                        content: "AI assistant ready! Ask me anything about this task.",
                        timestamp: new Date(),
                      },
                    ]);
                    hasInitialized.current = true;
                  }
                })
                .catch((err) => {
                  console.error("❌ Authentication failed:", err);
                  setError(err.message);
                });
              break;

            case "chat":
              const chatPayload = frame.payload;

              // Only process events for our session
              if (chatPayload?.sessionKey !== sessionKey) {
                break;
              }

              if (chatPayload?.state === "delta" && chatPayload?.message) {
                let content = "";
                if (typeof chatPayload.message === "string") {
                  content = chatPayload.message;
                } else if (chatPayload.message?.content) {
                  if (Array.isArray(chatPayload.message.content)) {
                    content = chatPayload.message.content
                      .filter((item: any) => item.type === "text")
                      .map((item: any) => item.text)
                      .join("");
                  } else if (typeof chatPayload.message.content === "string") {
                    content = chatPayload.message.content;
                  }
                }

                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg?.role === "assistant") {
                    lastMsg.content = content;
                  } else {
                    newMessages.push({
                      role: "assistant",
                      content: content,
                      timestamp: new Date(),
                    });
                  }
                  return newMessages;
                });
              } else if (chatPayload?.state === "final") {
                setIsStreaming(false);
              } else if (chatPayload?.state === "error") {
                setError(chatPayload.errorMessage || "Chat error occurred");
                setIsStreaming(false);
              } else if (chatPayload?.state === "aborted") {
                setIsStreaming(false);
              }
              break;
          }
        }
      } catch (error) {
        console.error("❌ Failed to parse WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("❌ [TaskAIChatPanel] WebSocket error:", error);
      setIsConnected(false);
      setError("Failed to connect to OpenClaw Gateway");
    };

    ws.onclose = (event) => {
      console.log("🔌 [TaskAIChatPanel] Disconnected from OpenClaw");
      console.log("Close event:", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [sessionKey]);

  const sendMessage = async () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !isAuthenticated) {
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    try {
      // On first message, include system context
      const messageToSend = isFirstMessage
        ? `[System Context: ${buildSystemPrompt()}]\n\nUser: ${userMessage.content}`
        : userMessage.content;

      const id = generateId();
      const frame: RequestFrame = {
        type: "req",
        id,
        method: "chat.send",
        params: {
          sessionKey: sessionKey,
          message: messageToSend,
          idempotencyKey: generateId(),
        },
      };

      const responsePromise = new Promise<any>((resolve, reject) => {
        pendingRequests.current.set(id, { resolve, reject });
        setTimeout(() => {
          if (pendingRequests.current.has(id)) {
            pendingRequests.current.delete(id);
            reject(new Error("Request timeout: chat.send"));
          }
        }, 30000);
      });

      wsRef.current.send(JSON.stringify(frame));
      console.log("📤 Sent message:", frame);

      await responsePromise;

      if (isFirstMessage) {
        setIsFirstMessage(false);
      }
    } catch (err: any) {
      console.error("❌ Error sending message:", err);
      setError("Failed to send message: " + err.message);
      setIsStreaming(false);
      setMessages((prev) => prev.slice(0, -1));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="p-6 border border-gray-800 rounded-xl flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgba(212,175,55,0.2)]">
        <div className="flex items-center gap-2">
          <IconSparkles size={20} className="text-[#d4af37]" />
          <h2 className="text-lg font-semibold">AI Task Assistant</h2>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <span className="text-xs text-green-400">● Ready</span>
          ) : isConnected ? (
            <span className="text-xs text-yellow-400">● Connecting...</span>
          ) : (
            <span className="text-xs text-red-400">● Disconnected</span>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-[#d4af37] text-black"
                  : msg.role === "system"
                  ? "bg-[rgba(212,175,55,0.1)] text-[#d4af37] text-center w-full"
                  : "bg-[rgba(255,255,255,0.05)] text-[#e5e5e5]"
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-[rgba(255,255,255,0.05)] px-3 py-2 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-[rgba(212,175,55,0.2)]">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isAuthenticated ? "Ask about this task..." : "Connecting..."}
          disabled={!isAuthenticated || isStreaming}
          className="flex-1 px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(212,175,55,0.2)] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-[#d4af37] disabled:opacity-50 text-sm"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || !isAuthenticated || isStreaming}
          className="px-4 py-2 bg-[#d4af37] text-black rounded-lg hover:bg-[#c49d2f] transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
        >
          <IconSend size={16} />
        </button>
      </div>
    </div>
  );
}
