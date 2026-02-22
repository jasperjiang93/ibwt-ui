"use client";

import { useState, useRef, useEffect, useCallback } from "react";

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

interface OpenClawChatModalProps {
  onClose: () => void;
  systemPrompt?: string;
}

export function OpenClawChatModal({
  onClose,
  systemPrompt = "You are a helpful AI assistant for the IBWT platform. IBWT is a blockchain-based platform for AI agents and tasks. Be concise, friendly, and helpful. Always provide accurate information about IBWT features."
}: OpenClawChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionKey] = useState(`agent:main:ibwt-chat-${Date.now()}`);
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

  // Connect to OpenClaw WebSocket
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_OPENCLAW_WS_URL || "ws://localhost:18789";
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    // Request helper - defined inside useEffect to capture correct ws instance
    function request(method: string, params?: any): Promise<any> {
      return new Promise((resolve, reject) => {
        if (ws.readyState !== WebSocket.OPEN) {
          reject(new Error("WebSocket not connected"));
          return;
        }

        const id = generateId();
        const frame: RequestFrame = { type: "req", id, method, params };

        pendingRequests.current.set(id, { resolve, reject });

        // Timeout after 30 seconds
        setTimeout(() => {
          if (pendingRequests.current.has(id)) {
            pendingRequests.current.delete(id);
            reject(new Error(`Request timeout: ${method}`));
          }
        }, 30000);

        ws.send(JSON.stringify(frame));
        console.log("Sent request:", frame);
      });
    }

    ws.onopen = () => {
      console.log("Connected to OpenClaw Gateway");
      setIsConnected(true);
      setError(null);

      // Only add system message on first connection (avoid duplicates from StrictMode)
      if (!hasInitialized.current) {
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: "Connected to OpenClaw Gateway, waiting for challenge...",
            timestamp: new Date(),
          },
        ]);
      }
    };

    ws.onmessage = (event) => {
      try {
        const frame: GatewayFrame = JSON.parse(event.data);
        console.log("Received:", frame);

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
              // Respond to auth challenge
              console.log("Received challenge, authenticating...");
              const nonce = frame.payload?.nonce;

              request("connect", {
                minProtocol: 3,
                maxProtocol: 3,
                client: {
                  id: "test",
                  displayName: "IBWT Dashboard",
                  version: "1.0.0",
                  platform: "web",
                  mode: "test",
                },
                caps: [],
                auth: {
                  token: process.env.NEXT_PUBLIC_OPENCLAW_TOKEN || "c4a3fb721e4dd4b0c8e74054fb78a8c59f66863c2aaeccb3",
                },
              })
                .then((helloOk) => {
                  console.log("Connected successfully:", helloOk);
                  setIsAuthenticated(true);

                  // Only add system message on first connection (avoid duplicates from StrictMode)
                  if (!hasInitialized.current) {
                    setMessages((prev) => [
                      ...prev,
                      {
                        role: "system",
                        content: "Session ready! You can start chatting.",
                        timestamp: new Date(),
                      },
                    ]);
                    hasInitialized.current = true;
                  }
                })
                .catch((err) => {
                  console.error("Connect failed:", err);
                  setError(err.message);
                });
              break;

            case "chat":
              // Chat event (streaming response)
              const chatPayload = frame.payload;

              // Only process events for our session
              if (chatPayload?.sessionKey !== sessionKey) {
                console.log("Ignoring chat event for different session:", chatPayload?.sessionKey);
                break;
              }

              if (chatPayload?.state === "delta" && chatPayload?.message) {
                // Extract text from message content
                let content = "";
                if (typeof chatPayload.message === "string") {
                  content = chatPayload.message;
                } else if (chatPayload.message?.content) {
                  // Content is an array of {type: "text", text: "..."} objects
                  if (Array.isArray(chatPayload.message.content)) {
                    content = chatPayload.message.content
                      .filter((item: any) => item.type === "text")
                      .map((item: any) => item.text)
                      .join("");
                  } else if (typeof chatPayload.message.content === "string") {
                    content = chatPayload.message.content;
                  }
                }

                // Update or create assistant message (OpenClaw sends full accumulated message each time)
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg?.role === "assistant") {
                    // Update existing assistant message
                    lastMsg.content = content;
                  } else {
                    // Create new assistant message on first delta
                    newMessages.push({
                      role: "assistant",
                      content: content,
                      timestamp: new Date(),
                    });
                  }
                  return newMessages;
                });
              } else if (chatPayload?.state === "final") {
                // Response complete
                setIsStreaming(false);
              } else if (chatPayload?.state === "error") {
                // Error in chat
                setError(chatPayload.errorMessage || "Chat error occurred");
                setIsStreaming(false);
              } else if (chatPayload?.state === "aborted") {
                // Chat aborted
                setIsStreaming(false);
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "system",
                    content: "Response aborted",
                    timestamp: new Date(),
                  },
                ]);
              }
              break;

            case "shutdown":
              // Server is shutting down
              console.log("Server shutdown:", frame.payload);
              break;

            default:
              console.log("Event:", frame.event, frame.payload);
          }
        }
      } catch (err) {
        console.error("Failed to parse message:", err, event.data);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("Failed to connect to OpenClaw Gateway. Make sure it's running on localhost:18789");
      setIsConnected(false);
    };

    ws.onclose = (event) => {
      console.log("Disconnected from OpenClaw Gateway", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
      setIsConnected(false);
      setIsAuthenticated(false);
      setIsStreaming(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `Disconnected from OpenClaw Gateway (${event.code}: ${event.reason || "no reason"})`,
          timestamp: new Date(),
        },
      ]);
    };

    return () => {
      console.log("Cleaning up WebSocket connection");
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []); // Run only on mount/unmount - handlers capture stable refs

  const sendMessage = async () => {
    if (!input.trim() || isStreaming || !isConnected || !isAuthenticated) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);
    setError(null);

    try {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        throw new Error("WebSocket not connected");
      }

      // On first message, include system prompt as context
      const messageToSend = isFirstMessage
        ? `[System Context: ${systemPrompt}]\n\nUser: ${userMessage.content}`
        : userMessage.content;

      // Send message directly via WebSocket
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

      // Create promise for response
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
      console.log("Sent message:", frame);

      await responsePromise;

      if (isFirstMessage) {
        setIsFirstMessage(false);
      }
    } catch (err: any) {
      console.error("Error sending message:", err);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-3xl h-[600px] bg-[#0a0a0a] border border-[rgba(212,175,55,0.3)] rounded-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#d4af37]">OpenClaw Chat</h2>
              <div className={`w-2 h-2 rounded-full ${
                isAuthenticated ? "bg-green-400" : isConnected ? "bg-yellow-400" : "bg-red-400"
              }`} />
            </div>
            <p className="text-xs text-[#888]">
              {isAuthenticated
                ? "Connected & Authenticated"
                : isConnected
                ? "Authenticating..."
                : "Disconnected"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#888] hover:text-white transition"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-[#666] py-8">
              <p>Start a conversation with OpenClaw AI</p>
              <p className="text-xs mt-2">Make sure OpenClaw gateway is running: <code className="text-[#d4af37]">openclaw gateway</code></p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user" ? "justify-end" : msg.role === "system" ? "justify-center" : "justify-start"
              }`}
            >
              <div
                className={`${
                  msg.role === "user"
                    ? "max-w-[80%] bg-[#d4af37] text-black rounded-lg px-4 py-2"
                    : msg.role === "system"
                    ? "text-xs text-[#666] bg-gray-900 rounded px-3 py-1"
                    : "max-w-[80%] bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                {msg.role !== "system" && (
                  <div className="text-xs mt-1 opacity-60">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-lg px-4 py-2 border border-gray-700">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-pulse delay-100" />
                  <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-pulse delay-200" />
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 rounded-lg p-2">
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isAuthenticated ? "Type your message..." : "Waiting for authentication..."}
              disabled={isStreaming || !isAuthenticated}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] resize-none disabled:opacity-50"
              rows={2}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming || !isAuthenticated}
              className="px-6 py-2 bg-[#d4af37] text-black rounded-lg hover:bg-[#c49d2f] transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-[#666] mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
