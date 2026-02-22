"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface OpenClawContextType {
  isConnected: boolean;
  sendMessage: (role: "user" | "system", content: string) => void;
  messages: Message[];
  isLoading: boolean;
  sessionId: string;
}

const OpenClawContext = createContext<OpenClawContextType | null>(null);

export function OpenClawProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_OPENCLAW_WS_URL || "ws://localhost:18789";
    const token = process.env.NEXT_PUBLIC_OPENCLAW_TOKEN || "";

    console.log("🔌 [OpenClawProvider] Connecting to OpenClaw...");
    console.log("WebSocket URL:", wsUrl);
    console.log("Token:", token ? `${token.substring(0, 8)}...` : "(empty)");

    const ws = new WebSocket(`${wsUrl}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log("✅ [OpenClawProvider] Connected to OpenClaw");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "session_created") {
          setSessionId(data.session_id);
          console.log("📋 [OpenClawProvider] Session created:", data.session_id);
        } else if (data.type === "message") {
          if (data.role === "assistant") {
            setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
            setIsLoading(false);
          }
        } else if (data.type === "error") {
          console.error("❌ [OpenClawProvider] OpenClaw error:", data.message);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `Error: ${data.message}` },
          ]);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("❌ [OpenClawProvider] WebSocket error:", error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log("🔌 [OpenClawProvider] Disconnected from OpenClaw");
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const sendMessage = (role: "user" | "system", content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn("⚠️ WebSocket not connected");
      return;
    }

    if (role === "user") {
      setMessages((prev) => [...prev, { role: "user", content }]);
      setIsLoading(true);
    }

    wsRef.current.send(
      JSON.stringify({
        type: "message",
        role,
        content,
      })
    );
  };

  return (
    <OpenClawContext.Provider
      value={{
        isConnected,
        sendMessage,
        messages,
        isLoading,
        sessionId,
      }}
    >
      {children}
    </OpenClawContext.Provider>
  );
}

export function useOpenClaw() {
  const context = useContext(OpenClawContext);
  if (!context) {
    throw new Error("useOpenClaw must be used within OpenClawProvider");
  }
  return context;
}
