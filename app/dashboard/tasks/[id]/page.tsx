"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { api, Task, Bid, TaskResult, ResultOutput } from "@/lib/api";
import { ibwtToUsd } from "@/lib/format";
import { TaskChat } from "@/components/task-chat";
import { useState } from "react";

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;
  const { signTransaction, publicKey } = useWallet();
  const [accepting, setAccepting] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"total" | "eta_minutes">("total");

  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => api.getTask(taskId),
  });

  const { data: bidsData, isLoading: bidsLoading } = useQuery({
    queryKey: ["task-bids", taskId, sortBy],
    queryFn: () => api.getTaskBids(taskId),
  });

  // Sort bids
  const sortedBids = bidsData?.bids?.sort((a, b) => {
    if (sortBy === "total") return a.total - b.total;
    return a.eta_minutes - b.eta_minutes;
  });

  const handleAcceptBid = async (bid: Bid) => {
    if (!signTransaction || !publicKey) {
      alert("Please connect your wallet");
      return;
    }

    setAccepting(bid.id);
    try {
      // 1. Accept the bid
      await api.acceptBid(bid.id);

      // 2. Get payment transaction
      const { transaction: txBase64 } = await api.preparePayment(taskId);

      // TODO: Build and sign Anchor transaction
      // const tx = ...
      // const signedTx = await signTransaction(tx);
      // const txId = await connection.sendRawTransaction(signedTx.serialize());
      // await api.confirmPayment(taskId, txId);

      alert("Bid accepted! (Payment flow TODO)");
    } catch (error) {
      console.error("Failed to accept bid:", error);
      alert("Failed to accept bid");
    } finally {
      setAccepting(null);
    }
  };

  const handleApprove = async () => {
    try {
      await api.approveResult(taskId);
      alert("Result approved! Payment released.");
    } catch (error) {
      console.error("Failed to approve:", error);
    }
  };

  const handleDispute = async () => {
    const reason = prompt("Reason for dispute:");
    if (!reason) return;

    try {
      await api.disputeTask(taskId, reason);
      alert("Task disputed. 20% will be released to agent.");
    } catch (error) {
      console.error("Failed to dispute:", error);
    }
  };

  if (taskLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!task) {
    return <div>Task not found</div>;
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Task Details</h1>
          <StatusBadge status={task.status} />
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-400">
            {task.budgetIbwt} $IBWT
          </div>
          <div className="text-[#999] text-sm">≈ {ibwtToUsd(task.budgetIbwt)}</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left: Request */}
        <div className="p-6 border border-gray-800 rounded-xl">
          <h2 className="text-lg font-semibold mb-3">Request</h2>
          <p className="text-gray-300 whitespace-pre-wrap">{task.request}</p>
        </div>

        {/* Right: Chat (only show when task has an assigned agent) */}
        {task.acceptedBidId && (
          <TaskChat taskId={taskId} userRole="user" />
        )}
      </div>

      {/* Bids */}
      {task.status === "open" && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Bids ({sortedBids?.length || 0})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy("total")}
                className={`px-3 py-1 rounded text-sm ${
                  sortBy === "total" ? "bg-purple-600" : "bg-gray-800"
                }`}
              >
                Price
              </button>
              <button
                onClick={() => setSortBy("eta_minutes")}
                className={`px-3 py-1 rounded text-sm ${
                  sortBy === "eta_minutes" ? "bg-purple-600" : "bg-gray-800"
                }`}
              >
                ETA
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {bidsLoading ? (
              <div className="animate-pulse">Loading bids...</div>
            ) : sortedBids?.length === 0 ? (
              <div className="text-gray-500 p-8 text-center border border-gray-800 rounded-xl">
                No bids yet. Agents will submit bids soon.
              </div>
            ) : (
              sortedBids?.map((bid) => (
                <BidCard
                  key={bid.id}
                  bid={bid}
                  onAccept={() => handleAcceptBid(bid)}
                  accepting={accepting === bid.id}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Result */}
      {task.status === "pending_review" && (
        <ResultSection
          taskId={taskId}
          onApprove={handleApprove}
          onDispute={handleDispute}
        />
      )}

      {task.status === "completed" && (
        <ResultSection taskId={taskId} readonly />
      )}
    </div>
  );
}

// ============ Components ============

function BidCard({
  bid,
  onAccept,
  accepting,
}: {
  bid: Bid;
  onAccept: () => void;
  accepting: boolean;
}) {
  return (
    <div className="p-5 border border-gray-800 rounded-xl hover:border-gray-700 transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">
              {bid.agent?.name || "Agent"}
            </span>
            {bid.agent?.rating && (
              <span className="text-yellow-400 text-sm">
                ⭐ {bid.agent.rating}
              </span>
            )}
          </div>
          <div className="text-gray-500 text-sm mt-1">
            ETA: {bid.eta_minutes} minutes
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-400">
            {bid.total} $IBWT
          </div>
          <div className="text-[#999] text-xs">≈ {ibwtToUsd(bid.total)}</div>
        </div>
      </div>

      {/* MCP Breakdown */}
      <div className="bg-gray-900 rounded-lg p-4 mb-4">
        <div className="text-sm text-gray-400 mb-2">Cost Breakdown</div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Agent Fee</span>
            <span className="text-white">{bid.agent_fee} $IBWT</span>
          </div>
          {bid.mcp_plan?.map((mcp, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-400">
                {mcp.mcp_name} ({mcp.calls}×{mcp.price_per_call})
              </span>
              <span className="text-white">{mcp.subtotal} $IBWT</span>
            </div>
          ))}
          <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-purple-400">{bid.total} $IBWT <span className="text-[#999] font-normal">≈ {ibwtToUsd(bid.total)}</span></span>
          </div>
        </div>
      </div>

      {/* Message */}
      {bid.message && (
        <p className="text-gray-400 text-sm mb-4">{bid.message}</p>
      )}

      {/* Accept Button */}
      <button
        onClick={onAccept}
        disabled={accepting}
        className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition"
      >
        {accepting ? "Processing..." : "Accept Bid"}
      </button>
    </div>
  );
}

function ResultSection({
  taskId,
  onApprove,
  onDispute,
  readonly = false,
}: {
  taskId: string;
  onApprove?: () => void;
  onDispute?: () => void;
  readonly?: boolean;
}) {
  // In real app, fetch result from API
  const mockResult: TaskResult = {
    id: "1",
    task_id: taskId,
    outputs: [
      {
        type: "text",
        label: "Summary",
        content: "This is the analysis summary...",
      },
      {
        type: "image",
        label: "Chart",
        url: "https://via.placeholder.com/600x400",
      },
    ],
    revision_count: 0,
    submitted_at: new Date().toISOString(),
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-4">Result</h2>
      
      <div className="space-y-4">
        {mockResult.outputs.map((output, i) => (
          <OutputItem key={i} output={output} />
        ))}
      </div>

      {!readonly && (
        <div className="flex gap-4 mt-6">
          <button
            onClick={onApprove}
            className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
          >
            ✓ Approve & Pay
          </button>
          <button
            onClick={onDispute}
            className="flex-1 py-3 bg-red-600/20 text-red-400 border border-red-600 rounded-lg font-semibold hover:bg-red-600/30"
          >
            ✗ Dispute
          </button>
        </div>
      )}
    </div>
  );
}

function OutputItem({ output }: { output: ResultOutput }) {
  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <div className="bg-gray-900 px-4 py-2 text-sm font-medium flex items-center gap-2">
        {output.type === "text" && "📝"}
        {output.type === "image" && "🖼️"}
        {output.type === "file" && "📎"}
        {output.type === "audio" && "🎵"}
        {output.type === "video" && "🎬"}
        {output.label}
      </div>
      
      <div className="p-4">
        {output.type === "text" && (
          <p className="text-gray-300 whitespace-pre-wrap">{output.content}</p>
        )}
        
        {output.type === "image" && (
          <img
            src={output.url}
            alt={output.label}
            className="max-w-full rounded-lg"
          />
        )}
        
        {output.type === "audio" && (
          <audio controls className="w-full">
            <source src={output.url} />
          </audio>
        )}
        
        {output.type === "video" && (
          <video controls className="w-full rounded-lg">
            <source src={output.url} />
          </video>
        )}
        
        {output.type === "file" && (
          <a
            href={output.url}
            download={output.filename}
            className="flex items-center gap-2 text-purple-400 hover:underline"
          >
            📥 Download {output.filename}
            {output.size && (
              <span className="text-gray-500 text-sm">
                ({(output.size / 1024 / 1024).toFixed(1)} MB)
              </span>
            )}
          </a>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: "bg-green-500/20 text-green-400",
    locked: "bg-blue-500/20 text-blue-400",
    in_progress: "bg-yellow-500/20 text-yellow-400",
    pending_review: "bg-purple-500/20 text-purple-400",
    completed: "bg-gray-500/20 text-gray-400",
    disputed: "bg-red-500/20 text-red-400",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${colors[status] || colors.open}`}>
      {status.replace("_", " ")}
    </span>
  );
}
