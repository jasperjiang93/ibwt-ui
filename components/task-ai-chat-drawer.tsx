"use client";

import { useState, useEffect, useRef } from "react";
import { IconSend, IconSparkles } from "@/components/icons";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface TaskAIChatDrawerProps {
  taskContext: any; // Complete task data
  isOpen: boolean;
  onToggle: () => void;
}

export function TaskAIChatDrawer({ taskContext, isOpen, onToggle }: TaskAIChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>("");
  const initialSummarySentRef = useRef<boolean>(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connect to OpenClaw when drawer opens
  useEffect(() => {
    if (!isOpen) return;

    // Reset flag when drawer opens
    initialSummarySentRef.current = false;

    const wsUrl = process.env.NEXT_PUBLIC_OPENCLAW_WS_URL || "ws://localhost:18789";
    const token = process.env.NEXT_PUBLIC_OPENCLAW_TOKEN || "";

    const ws = new WebSocket(`${wsUrl}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log("✅ Connected to OpenClaw for task AI assistant");
      // Don't send initial message here - wait for session_created event
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "session_created") {
          sessionIdRef.current = data.session_id;
          console.log("📋 Session created:", data.session_id);

          // Now that session is ready, send initial summary request
          if (!initialSummarySentRef.current) {
            initialSummarySentRef.current = true;
            setTimeout(() => {
              sendInitialSummaryRequest();
            }, 200); // Small delay to ensure session is fully ready
          }
        } else if (data.type === "message") {
          if (data.role === "assistant") {
            setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
            setIsLoading(false);
          }
        } else if (data.type === "error") {
          console.error("❌ OpenClaw error:", data.message);
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
      console.error("❌ WebSocket error:", error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log("🔌 Disconnected from OpenClaw");
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [isOpen]);

  const sendInitialSummaryRequest = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    // Build context message
    const contextPrompt = buildTaskContextPrompt();

    // Send system message with context
    wsRef.current.send(
      JSON.stringify({
        type: "message",
        role: "system",
        content: contextPrompt,
      })
    );

    // Request summary
    const summaryRequest = "Please provide a concise summary of this task, including status, budget, bids, and results. Then ask me what I'd like to know.";

    setMessages([{ role: "user", content: "Analyze this task" }]);
    setIsLoading(true);

    wsRef.current.send(
      JSON.stringify({
        type: "message",
        role: "user",
        content: summaryRequest,
      })
    );
  };

  const buildTaskContextPrompt = () => {
    const { task, bids, acceptedBid, results } = taskContext;

    return `You are a helpful AI assistant for the IBWT platform. You are currently helping a user understand a specific task.

TASK DETAILS:
- ID: ${task.id}
- Request: "${task.request}"
- Budget: ${task.budgetIbwt} $IBWT
- Status: ${task.status}
- Created: ${new Date(task.createdAt).toLocaleString()}
${task.deadline ? `- Deadline: ${new Date(task.deadline).toLocaleString()}` : ""}

BIDS RECEIVED (${bids?.length || 0}):
${bids?.map((bid: any, i: number) => `
${i + 1}. ${bid.agent.name} - ${bid.total} $IBWT (${bid.status})
   - Agent Fee: ${bid.agentFee} $IBWT
   - Message: "${bid.message}"
   - MCPs: ${bid.mcpPlan?.map((m: any) => `${m.mcp_name} (${m.calls} calls)`).join(", ") || "None"}
`).join("") || "No bids yet"}

${acceptedBid ? `
ACCEPTED BID:
- Agent: ${acceptedBid.agent.name}
- Total: ${acceptedBid.total} $IBWT
- Status: Accepted
` : "No bid accepted yet"}

${results && results.length > 0 ? `
TASK RESULTS (${results.length}):
${results.map((r: any, i: number) => `
${i + 1}. ${r.label} (${r.type})
   ${r.content ? `Content: ${r.content.substring(0, 200)}...` : ""}
`).join("")}
` : "No results submitted yet"}

Your role:
1. Provide a concise, helpful summary of this task
2. Answer questions about the task, bids, results, or next steps
3. Be friendly and professional
4. Keep responses concise

Remember: The user can see all the task details on the page, so focus on insights and answering specific questions rather than just repeating information.`;
  };

  const handleSend = () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    wsRef.current.send(
      JSON.stringify({
        type: "message",
        role: "user",
        content: input,
      })
    );

    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 bg-[rgba(212,175,55,0.1)] text-[#d4af37] border border-[rgba(212,175,55,0.3)] rounded-lg hover:bg-[rgba(212,175,55,0.15)] transition flex items-center justify-center gap-2 font-semibold"
      >
        <IconSparkles size={20} />
        💬 Ask AI about this task
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[rgba(212,175,55,0.3)] bg-[#0a0a0f] shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.05)]">
        <div className="flex items-center gap-2">
          <IconSparkles size={20} className="text-[#d4af37]" />
          <h3 className="font-semibold text-[#d4af37]">AI Task Assistant</h3>
          {isConnected ? (
            <span className="text-xs text-green-400">● Connected</span>
          ) : (
            <span className="text-xs text-red-400">● Disconnected</span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="text-[#888] hover:text-white transition text-sm"
        >
          Collapse ↓
        </button>
      </div>

      {/* Chat Messages */}
      <div className="h-[400px] overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-[#d4af37] text-black"
                  : "bg-[rgba(255,255,255,0.05)] text-[#e5e5e5]"
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[rgba(255,255,255,0.05)] px-4 py-2 rounded-lg">
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
      <div className="px-6 py-4 border-t border-[rgba(212,175,55,0.2)] bg-[rgba(10,10,15,0.8)]">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about this task..."
            disabled={!isConnected}
            className="flex-1 px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(212,175,55,0.2)] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-[#d4af37] disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !isConnected || isLoading}
            className="px-4 py-2 bg-[#d4af37] text-black rounded-lg hover:bg-[#c49d2f] transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
          >
            <IconSend size={18} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
