"use client";

import { useState, useRef, useEffect } from "react";
import { extractTaskDetailsFromConversation, ExtractedTaskData } from "@/lib/chat-extraction";
import { matchAgentsToTask, MatchedAgent } from "@/lib/matching";
import { generateMockBids } from "@/lib/bid-generator";

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

type Stage = 'collecting' | 'analyzing' | 'confirming' | 'creating' | 'complete';

interface TaskCreationState {
  stage: Stage;
  extractedData: ExtractedTaskData;
  suggestedAgents: MatchedAgent[];
  createdTaskId: string | null;
}

interface TaskCreationChatModalProps {
  onClose: () => void;
  onTaskCreated: (taskId: string) => void;
  userWallet: string;
}

const SYSTEM_PROMPT = `You are a task analysis assistant for the IBWT platform. Your role is to help users create clear, well-defined tasks for AI agents.

RULES:
1. You do NOT execute tasks - you only help users define them
2. You do NOT provide price estimates - agents will bid after task creation
3. Ask questions to understand:
   - Detailed task description (what specifically needs to be done)
   - Budget in $IBWT tokens (user's maximum budget)
   - Any specific requirements or constraints
4. Ask follow-up questions to clarify vague requests
5. Only after gathering complete information, summarize the task details and ask: "Does this look good? Type 'yes' to create the task and receive bids from agents."
6. Be concise, friendly, and professional
7. IMPORTANT: Use plain text only. Do NOT use markdown formatting like **bold**, *italic*, or ###headers. Just write normally.

Example conversation:
User: "I need research help"
You: "I can help you set up that research task! Can you tell me more about what you need researched?"
User: "Competitor analysis for tech companies"
You: "Great! What's your budget in $IBWT tokens?"
User: "5000"
You: "Got it! Here's what I have:

Task: Competitor analysis for tech companies
Budget: 5000 $IBWT

Does this look good? Type 'yes' to create the task and receive bids from agents."`;

export function TaskCreationChatModal({
  onClose,
  onTaskCreated,
  userWallet,
}: TaskCreationChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionKey] = useState(`agent:main:task-creation-${Date.now()}`);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [taskState, setTaskState] = useState<TaskCreationState>({
    stage: 'collecting',
    extractedData: {
      request: '',
      budgetIbwt: null,
      keywords: [],
      isComplete: false,
    },
    suggestedAgents: [],
    createdTaskId: null,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingRequests = useRef<Map<string, { resolve: (payload: any) => void; reject: (err: Error) => void }>>(new Map());
  const hasInitialized = useRef(false);
  const isProcessingStage = useRef(false);
  const pendingMessage = useRef<string | null>(null);

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
        console.log("Sent request:", frame);
      });
    }

    ws.onopen = () => {
      console.log("Connected to OpenClaw Gateway");
      setIsConnected(true);
      setError(null);
      // Don't show connection messages to user
    };

    ws.onmessage = (event) => {
      try {
        const frame: GatewayFrame = JSON.parse(event.data);
        console.log("Received:", frame);

        if (frame.type === "res") {
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
              console.log("Received challenge, authenticating...");
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

                  if (!hasInitialized.current) {
                    setMessages((prev) => [
                      ...prev,
                      {
                        role: "assistant",
                        content: "Hi! I'm Task AI. Tell me what you need help with and I'll match you with the best agents.",
                        timestamp: new Date(),
                      },
                    ]);
                    hasInitialized.current = true;
                  }

                  // Send pending message if user typed before authentication completed
                  if (pendingMessage.current) {
                    console.log("Sending pending message:", pendingMessage.current);
                    const cachedMsg = pendingMessage.current;
                    pendingMessage.current = null;

                    // Remove the "Connecting..." system message
                    setMessages(prev => prev.filter(m => m.content !== "Connecting to AI assistant..."));

                    // Send the cached message now that we're authenticated
                    setTimeout(() => {
                      sendChatMessage(cachedMsg);
                    }, 100);
                  }
                })
                .catch((err) => {
                  console.error("Connect failed:", err);
                  setError(err.message);
                });
              break;

            case "chat":
              const chatPayload = frame.payload;

              if (chatPayload?.sessionKey !== sessionKey) {
                console.log("Ignoring chat event for different session:", chatPayload?.sessionKey);
                break;
              }

              console.log(`[Chat Event] state: ${chatPayload?.state}, has message: ${!!chatPayload?.message}`);

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

                if (!content) {
                  console.log("[Streaming] Delta has no content, skipping");
                  break;
                }

                console.log(`[Streaming] Delta: ${content.length} chars, last 50: "${content.slice(-50)}"`);

                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];

                  // OpenClaw sends accumulated content (not incremental)
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
                // Final event received - check if it includes a message
                if (chatPayload?.message) {
                  let finalContent = "";
                  if (typeof chatPayload.message === "string") {
                    finalContent = chatPayload.message;
                  } else if (chatPayload.message?.content) {
                    if (Array.isArray(chatPayload.message.content)) {
                      finalContent = chatPayload.message.content
                        .filter((item: any) => item.type === "text")
                        .map((item: any) => item.text)
                        .join("");
                    } else if (typeof chatPayload.message.content === "string") {
                      finalContent = chatPayload.message.content;
                    }
                  }

                  if (finalContent) {
                    console.log(`[Streaming] Final WITH message: ${finalContent.length} chars, last 50: "${finalContent.slice(-50)}"`);
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      const lastMsg = newMessages[newMessages.length - 1];
                      if (lastMsg?.role === "assistant") {
                        lastMsg.content = finalContent;
                      }
                      return newMessages;
                    });
                  } else {
                    console.log("[Streaming] Final event with empty message");
                  }
                } else {
                  console.log("[Streaming] Final event WITHOUT message - keeping last delta");
                }

                console.log("[Streaming] Response complete");
                setIsStreaming(false);
              } else if (chatPayload?.state === "error") {
                setError(chatPayload.errorMessage || "Chat error occurred");
                setIsStreaming(false);
              } else if (chatPayload?.state === "aborted") {
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
      // Don't show disconnect message to user (only log to console)
    };

    return () => {
      console.log("Cleaning up WebSocket connection");
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      // Clear all pending requests
      pendingRequests.current.clear();
    };
  }, []); // Empty deps - only run once on mount

  // Stage transition logic
  useEffect(() => {
    const processStageTransition = async () => {
      // Avoid re-processing the same stage
      if (isProcessingStage.current) return;
      isProcessingStage.current = true;

      try {
        // Extract data from conversation when in collecting stage (passively, don't auto-transition)
        if (taskState.stage === 'collecting' && messages.length > 0) {
          const extracted = extractTaskDetailsFromConversation(
            messages.filter(m => m.role !== 'system')
          );

          setTaskState(prev => ({ ...prev, extractedData: extracted }));

          // DO NOT auto-transition to analyzing - wait for user to say "create task"
          // This prevents conflicts with AI conversation flow
        }

        // Run agent matching when in analyzing stage
        if (taskState.stage === 'analyzing' && taskState.suggestedAgents.length === 0) {
          console.log('Analyzing task and matching agents...');
          setMessages(prev => [
            ...prev,
            {
              role: 'system',
              content: 'Analyzing your task and matching agents...',
              timestamp: new Date(),
            }
          ]);

          const matched = await matchAgentsToTask(
            taskState.extractedData.request,
            taskState.extractedData.keywords
          );

          setTaskState(prev => ({
            ...prev,
            suggestedAgents: matched,
            stage: 'confirming'
          }));

          // Auto-send AI message with suggestions
          if (matched.length > 0) {
            const suggestions = matched.map((agent, i) =>
              `${i + 1}. ${agent.agentName} (Match: ${Math.round(agent.matchScore * 100)}%) - ${agent.matchedCapabilities.join(', ')}`
            ).join('\n');

            const mcpInfo = matched[0].suggestedMcps.length > 0
              ? `\n\nRecommended MCP Tools:\n${matched[0].suggestedMcps.map(mcp =>
                  `- ${mcp.mcpName} (${mcp.pricePerCall} $IBWT per call)`
                ).join('\n')}`
              : '';

            setMessages(prev => [
              ...prev,
              {
                role: 'assistant',
                content: `Based on your requirements, I found these matching agents:\n\n${suggestions}${mcpInfo}\n\nWould you like to create this task and receive bids from these agents? Type "yes" to confirm.`,
                timestamp: new Date(),
              }
            ]);
          } else {
            setMessages(prev => [
              ...prev,
              {
                role: 'assistant',
                content: 'No agents currently available for this task type (all agents are busy). Please try again in a few moments, or describe your task differently and I\'ll search again.',
                timestamp: new Date(),
              }
            ]);
            // Reset to collecting and mark as needing fresh context
            setTaskState(prev => ({ ...prev, stage: 'collecting' }));
            setIsFirstMessage(true); // Reset to send system context on next message
          }
        }
      } finally {
        isProcessingStage.current = false;
      }
    };

    processStageTransition();
  }, [taskState.stage, messages.length]);

  // Core function to send a chat message
  const sendChatMessage = async (messageText: string) => {
    if (!messageText.trim() || isStreaming || !isConnected || !isAuthenticated) return;

    const userMessage: Message = {
      role: "user",
      content: messageText.trim(),
      timestamp: new Date(),
    };

    // Only add message if it's not already there (avoid duplicates)
    setMessages((prev) => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg?.role === "user" && lastMsg?.content === messageText.trim()) {
        return prev; // Message already added
      }
      return [...prev, userMessage];
    });

    const currentInput = messageText.trim();
    setError(null);

    // Check for confirmation keywords when in confirming stage
    const confirmKeywords = ['yes', 'confirm', 'create', 'ok', 'sure', 'proceed', 'go ahead', 'sounds good'];
    const isConfirmation = taskState.stage === 'confirming' &&
      confirmKeywords.some(kw => currentInput.toLowerCase().includes(kw));

    // Check if user confirms to create task (triggers agent matching)
    // Only trigger on exact match or as standalone word to avoid false positives
    const analyzeKeywords = ['yes', 'yeah', 'yep', 'sure', 'okay', 'ok'];
    const analyzePhrases = ['sounds good', 'looks good', 'create task', 'create it'];

    const exactMatch = analyzeKeywords.some(kw => currentInput.toLowerCase().trim() === kw);
    const phraseMatch = analyzePhrases.some(phrase => currentInput.toLowerCase().includes(phrase));

    const shouldAnalyze = taskState.stage === 'collecting' && (exactMatch || phraseMatch);

    // Handle manual analysis trigger
    if (shouldAnalyze) {
      setTaskState(prev => ({ ...prev, stage: 'analyzing' }));
      // Don't add message here - let useEffect stage transition handle it
      return; // Don't send to OpenClaw, let stage transition handle it
    }

    if (isConfirmation) {
      // Move to creating stage
      setTaskState(prev => ({ ...prev, stage: 'creating' }));
      setMessages(prev => [
        ...prev,
        {
          role: 'system',
          content: 'Creating your task and generating bids...',
          timestamp: new Date(),
        }
      ]);

      try {
        // Validate budget before creating
        if (!taskState.extractedData.budgetIbwt || taskState.extractedData.budgetIbwt <= 0) {
          console.error('❌ Cannot create task: budget is missing or invalid');
          setError('Cannot create task: budget is required');
          setMessages(prev => [
            ...prev,
            {
              role: 'system',
              content: 'Error: Budget is required to create a task. Please specify your budget in $IBWT tokens.',
              timestamp: new Date(),
            }
          ]);
          setTaskState(prev => ({ ...prev, stage: 'collecting' }));
          return;
        }

        // Create task
        const requestBody = {
          userAddress: userWallet,
          request: taskState.extractedData.request,
          budgetIbwt: taskState.extractedData.budgetIbwt,
          requirements: {
            conversation: messages,
            keywords: taskState.extractedData.keywords,
            suggestedAgents: taskState.suggestedAgents,
          },
        };

        console.log('📤 Creating task with data:', {
          userAddress: requestBody.userAddress,
          budgetIbwt: requestBody.budgetIbwt,
          requestLength: requestBody.request.length,
          keywordsCount: requestBody.requirements.keywords.length,
        });

        const taskRes = await fetch('/api/dashboard/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!taskRes.ok) {
          const errorData = await taskRes.text();
          console.error('❌ Task creation failed:', errorData);
          throw new Error(`Failed to create task: ${errorData}`);
        }

        const { task } = await taskRes.json();
        console.log('Task created:', task);

        // Wait 5 seconds before generating bids (more realistic)
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Generate mock bids
        await generateMockBids(
          task.id,
          taskState.extractedData.budgetIbwt!,
          taskState.suggestedAgents
        );

        setTaskState(prev => ({
          ...prev,
          createdTaskId: task.id,
          stage: 'complete'
        }));

        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `✓ Task created successfully! ${taskState.suggestedAgents.length} agents have submitted bids. Redirecting to task page...`,
            timestamp: new Date(),
          }
        ]);

        // Navigate to task after 2 seconds
        setTimeout(() => {
          onTaskCreated(task.id);
        }, 2000);
      } catch (err: any) {
        console.error('Error creating task:', err);
        setError('Failed to create task: ' + err.message);
        setTaskState(prev => ({ ...prev, stage: 'confirming' }));
      }

      return;
    }

    // Regular message flow via OpenClaw
    setIsStreaming(true);

    try {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        throw new Error("WebSocket not connected");
      }

      // Mark first message as sent BEFORE sending to prevent duplicate system prompts
      const wasFirstMessage = isFirstMessage;
      if (isFirstMessage) {
        setIsFirstMessage(false);
      }

      // For first message, prepend system prompt to message
      const messageToSend = wasFirstMessage
        ? `${SYSTEM_PROMPT}\n\nUser: ${currentInput}`
        : currentInput;

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
      console.log("Sent message:", frame);

      await responsePromise;
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError("Failed to send message: " + err.message);
      setIsStreaming(false);
      setMessages((prev) => prev.slice(0, -1));
    }
  };

  // Wrapper function for UI button/enter key
  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    // If not authenticated yet, cache the message and show waiting indicator
    if (!isConnected || !isAuthenticated) {
      console.log("Not authenticated yet, caching message:", input.trim());
      pendingMessage.current = input.trim();

      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: input.trim(),
          timestamp: new Date(),
        },
        {
          role: "system",
          content: "Connecting to AI assistant...",
          timestamp: new Date(),
        }
      ]);
      setInput("");
      return;
    }

    // Normal flow: send immediately
    const messageText = input.trim();
    setInput("");
    await sendChatMessage(messageText);
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
              <h2 className="text-xl font-bold text-[#d4af37]">Task Agent</h2>
              <div className={`w-2 h-2 rounded-full ${
                isAuthenticated ? "bg-green-400" : isConnected ? "bg-yellow-400" : "bg-red-400"
              }`} />
              <span className="text-xs text-[#666] ml-2">
                Stage: {taskState.stage}
              </span>
            </div>
            <p className="text-xs text-[#888]">
              {isAuthenticated
                ? "AI assistant ready"
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
              <p>Start a conversation to create your task</p>
              <p className="text-xs mt-2">Make sure OpenClaw gateway is running: <code className="text-[#d4af37]">openclaw gateway</code></p>
            </div>
          )}
          {messages.map((msg, i) => {
            const isLastAssistantMsg = msg.role === "assistant" && i === messages.length - 1 && isStreaming;
            return (
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
                  {isLastAssistantMsg && (
                    <div className="mt-2 flex items-center gap-1 text-[#d4af37] text-xs">
                      <span>●</span>
                      <span className="animate-pulse">Streaming...</span>
                    </div>
                  )}
                  {msg.role !== "system" && (
                    <div className="text-xs mt-1 opacity-60">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {isStreaming && messages.length > 0 && messages[messages.length - 1]?.role !== "assistant" && (
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
              placeholder={isAuthenticated ? "Describe your task..." : "Waiting for authentication..."}
              disabled={isStreaming || !isAuthenticated || taskState.stage === 'creating' || taskState.stage === 'complete'}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] resize-none disabled:opacity-50"
              rows={2}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming || !isAuthenticated || taskState.stage === 'creating' || taskState.stage === 'complete'}
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
