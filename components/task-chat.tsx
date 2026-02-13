"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Message {
  id: string;
  task_id: string;
  sender_type: "user" | "agent" | "system";
  sender_name: string;
  content: string;
  message_type: "text" | "progress" | "file" | "system";
  attachments?: Attachment[];
  metadata?: {
    progress?: number;
  };
  created_at: string;
}

interface Attachment {
  type: string;
  url: string;
  filename?: string;
}

interface TaskChatProps {
  taskId: string;
  userRole: "user" | "agent";
}

export function TaskChat({ taskId, userRole }: TaskChatProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch messages
  const { data } = useQuery({
    queryKey: ["task-messages", taskId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/tasks/${taskId}/messages`);
      return res.json();
    },
    refetchInterval: 3000, // Poll every 3s (replace with WebSocket in production)
  });

  const messages: Message[] = data?.messages || [];

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/v1/tasks/${taskId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-messages", taskId] });
      setNewMessage("");
    },
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    if (newMessage.trim()) {
      sendMutation.mutate(newMessage.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[400px] border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-800">
        <h3 className="font-semibold">Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isOwn={
              (userRole === "user" && msg.sender_type === "user") ||
              (userRole === "agent" && msg.sender_type === "agent")
            } />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMutation.isPending}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  // System message
  if (message.sender_type === "system") {
    return (
      <div className="text-center">
        <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  // Progress message
  if (message.message_type === "progress") {
    const progress = message.metadata?.progress || 0;
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[80%] bg-gray-800 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">{message.sender_name}</span>
            <span className="text-xs text-gray-500">
              {formatTime(message.created_at)}
            </span>
          </div>
          <div className="text-sm text-gray-300 mb-2">{message.content}</div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">{progress}% complete</div>
        </div>
      </div>
    );
  }

  // Regular message
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-xl p-3 ${
          isOwn
            ? "bg-purple-600 text-white"
            : "bg-gray-800 text-gray-100"
        }`}
      >
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">
              {message.sender_type === "agent" ? "🤖 " : "👤 "}
              {message.sender_name}
            </span>
          </div>
        )}
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        
        {/* Attachments */}
        {message.attachments?.map((att, i) => (
          <div key={i} className="mt-2">
            {att.type === "image" ? (
              <img src={att.url} alt="" className="rounded-lg max-w-full" />
            ) : (
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm underline"
              >
                📎 {att.filename || "Attachment"}
              </a>
            )}
          </div>
        ))}
        
        <div className={`text-xs mt-1 ${isOwn ? "text-purple-200" : "text-gray-500"}`}>
          {formatTime(message.created_at)}
        </div>
      </div>
    </div>
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
