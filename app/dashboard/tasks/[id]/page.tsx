"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { api, Task, Bid, TaskResult, ResultOutput } from "@/lib/api";
import { ibwtToUsd } from "@/lib/format";
import { TaskChat } from "@/components/task-chat";
import { TaskAIChatPanel } from "@/components/task-ai-chat-panel";
import { buildLockFundsTransaction, buildApproveTransaction, buildDeclineTransaction } from "@/lib/escrow";
import { IBWT_DECIMALS } from "@/lib/solana";
import { useToast } from "@/components/toast";
import { useState } from "react";

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;
  const { sendTransaction, publicKey } = useWallet();
  const { connection } = useConnection();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [accepting, setAccepting] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [sortBy, setSortBy] = useState<"total" | "eta_minutes" | "rating">("total");

  // Try local database first, fallback to external API
  const { data: taskData, isLoading: taskLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      // Try local database API first
      const localRes = await fetch(`/api/dashboard/tasks/${taskId}`);
      if (localRes.ok) {
        const data = await localRes.json();
        return { task: data.task, bids: data.task.bids, isLocal: true };
      }

      // Fallback to external API
      const task = await api.getTask(taskId);
      const bidsData = await api.getTaskBids(taskId);
      return { task, bids: bidsData.bids, isLocal: false };
    },
  });

  const task = taskData?.task;
  const bidsLoading = taskLoading;
  const isLocal = taskData?.isLocal || false;

  // Sort bids (create new array to trigger re-render)
  const sortedBids = taskData?.bids ? [...taskData.bids].sort((a: any, b: any) => {
    if (sortBy === "total") return a.total - b.total;
    if (sortBy === "rating") return (b.agent?.rating || 0) - (a.agent?.rating || 0); // Highest rating first
    return (a.etaMinutes || a.eta_minutes || 0) - (b.etaMinutes || b.eta_minutes || 0);
  }) : [];

  const handleAcceptBid = async (bid: any) => {
    if (!sendTransaction || !publicKey) {
      showToast("error", "Please connect your wallet");
      return;
    }

    setAccepting(bid.id);
    try {
      // Get agent wallet address
      const agentWallet = new PublicKey(bid.agent?.walletAddress || bid.agentAddress);

      // Convert taskId (cuid string) to 32-byte Uint8Array for escrow contract
      const taskIdBytes = stringToTaskId(taskId);

      // Escrow deadline: 7 days from now
      const deadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

      // Convert bid.total to lamports (smallest unit)
      // Database stores human-readable amounts (e.g., 3750 = 3750 tokens)
      // SPL tokens need amounts in lamports (3750 tokens = 3750 * 10^9 lamports)
      const amountLamports = bid.total * Math.pow(10, IBWT_DECIMALS);

      console.log("Building lock_funds transaction...");
      console.log({
        user: publicKey.toBase58(),
        agent: agentWallet.toBase58(),
        amountTokens: bid.total,
        amountLamports,
        deadline,
      });

      // 1. Build lock_funds transaction
      const tx = await buildLockFundsTransaction({
        connection,
        user: publicKey,
        agent: agentWallet,
        taskId: taskIdBytes,
        amount: amountLamports,
        deadline,
      });

      // 2. Send transaction and wait for confirmation
      const signature = await sendTransaction(tx, connection);

      showToast("info", "Transaction sent, waiting for confirmation...");

      await connection.confirmTransaction(signature, "confirmed");

      // 3. Update database (local or external API)
      if (isLocal) {
        // Local database task
        await fetch(`/api/dashboard/tasks/${taskId}/accept-bid`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bidId: bid.id,
            escrowTxId: signature,
          }),
        });
      } else {
        // External API task
        await api.acceptBid(bid.id);
      }

      // 4. Show success message with explorer link
      showToast(
        "success",
        `Bid accepted! Funds locked in escrow.\nTransaction: ${signature.slice(0, 8)}...${signature.slice(-8)}`,
        {
          url: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
          text: "View on Solana Explorer →",
        }
      );

      // 5. Refresh data without full page reload
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    } catch (error: any) {
      console.error("Failed to accept bid:", error);
      let errorMsg = "Failed to accept bid";
      if (error.message) {
        errorMsg += `: ${error.message}`;
      }
      if (error.logs) {
        console.error("Transaction logs:", error.logs);
      }
      showToast("error", errorMsg);
    } finally {
      setAccepting(null);
    }
  };

  // Convert cuid string to 32-byte task ID for escrow contract
  function stringToTaskId(str: string): Uint8Array {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str);
    const taskId = new Uint8Array(32);
    taskId.set(encoded.slice(0, 32)); // Take first 32 bytes (or pad with zeros)
    return taskId;
  }

  const handleApprove = async () => {
    if (!sendTransaction || !publicKey || !task) {
      showToast("error", "Please connect your wallet");
      return;
    }

    if (approving) {
      console.log("Already approving, ignoring duplicate call");
      return;
    }

    setApproving(true);
    try {
      // Get agent wallet from accepted bid
      const acceptedBid = task.acceptedBid || sortedBids?.find((b: any) => b.id === task.acceptedBidId);
      if (!acceptedBid || !acceptedBid.agent?.walletAddress) {
        showToast("error", "Could not find agent wallet address");
        return;
      }

      const agentWallet = new PublicKey(acceptedBid.agent.walletAddress);
      const taskIdBytes = stringToTaskId(taskId);

      console.log("Building approve transaction...");
      console.log({
        user: publicKey.toBase58(),
        agent: agentWallet.toBase58(),
        taskIdHex: Buffer.from(taskIdBytes).toString('hex'),
        escrowTxId: task.escrowTxId,
      });

      // Check if user and agent are the same (not allowed in escrow)
      if (publicKey.toBase58() === agentWallet.toBase58()) {
        throw new Error("User and agent cannot be the same wallet address. This is a test data issue - agents should have different wallet addresses.");
      }

      // 1. Build approve transaction (releases 100% to agent)
      console.log("Calling buildApproveTransaction...");
      const tx = await buildApproveTransaction({
        connection,
        user: publicKey,
        agent: agentWallet,
        taskId: taskIdBytes,
      });
      console.log("Transaction built successfully");

      // 2. Send transaction and wait for confirmation
      console.log("Sending approve transaction...");
      let signature: string;
      try {
        signature = await sendTransaction(tx, connection);
        console.log("✅ Transaction sent:", signature);
      } catch (txError: any) {
        console.error("Transaction send error:", txError);
        console.error("Full error:", JSON.stringify(txError, null, 2));
        throw new Error(`Transaction failed: ${txError.message || 'Unknown transaction error'}`);
      }

      showToast("info", "Transaction sent, waiting for confirmation...");
      await connection.confirmTransaction(signature, "confirmed");
      console.log("✅ Transaction confirmed");

      // 3. Update database
      if (isLocal) {
        await fetch(`/api/dashboard/tasks/${taskId}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approveTxId: signature }),
        });
      } else {
        await api.approveResult(taskId);
      }

      // 4. Show success
      showToast(
        "success",
        `Result approved! 100% payment released to agent.\nTransaction: ${signature.slice(0, 8)}...${signature.slice(-8)}`,
        {
          url: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
          text: "View on Solana Explorer →",
        }
      );

      // 5. Refresh data
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    } catch (error: any) {
      console.error("❌ Failed to approve:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        logs: error.logs,
      });

      let errorMsg = error.message || "Unknown error";

      // Provide helpful error messages
      if (errorMsg.includes("0x1")) {
        errorMsg = "Escrow account not found. The lock_funds transaction may have failed.";
      } else if (errorMsg.includes("User rejected")) {
        errorMsg = "Transaction cancelled by user";
      }

      showToast("error", `Failed to approve: ${errorMsg}`);
    } finally {
      setApproving(false);
    }
  };

  const handleDecline = async () => {
    if (!sendTransaction || !publicKey || !task) {
      showToast("error", "Please connect your wallet");
      return;
    }

    if (declining) {
      console.log("Already declining, ignoring duplicate call");
      return;
    }

    const confirmDecline = confirm(
      "Are you sure you want to decline this result? You will receive a 100% refund."
    );
    if (!confirmDecline) return;

    setDeclining(true);
    try {
      const taskIdBytes = stringToTaskId(taskId);

      console.log("Building decline transaction...");
      console.log({
        user: publicKey.toBase58(),
      });

      // 1. Build decline transaction (100% refund to user)
      const tx = await buildDeclineTransaction({
        connection,
        user: publicKey,
        taskId: taskIdBytes,
      });

      // 2. Send transaction and wait for confirmation
      const signature = await sendTransaction(tx, connection);
      showToast("info", "Transaction sent, waiting for confirmation...");
      await connection.confirmTransaction(signature, "confirmed");

      // 3. Update database
      if (isLocal) {
        await fetch(`/api/dashboard/tasks/${taskId}/decline`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ declineTxId: signature }),
        });
      } else {
        await api.disputeTask(taskId, "User declined result");
      }

      // 4. Show success
      showToast(
        "success",
        `Result declined. 100% refund processed.\nTransaction: ${signature.slice(0, 8)}...${signature.slice(-8)}`,
        {
          url: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
          text: "View on Solana Explorer →",
        }
      );

      // 5. Refresh data
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    } catch (error: any) {
      console.error("Failed to decline:", error);
      showToast("error", `Failed to decline: ${error.message || "Unknown error"}`);
    } finally {
      setDeclining(false);
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
          <div className="text-2xl font-bold text-[#d4af37]">
            {task.acceptedBid ? task.acceptedBid.total : task.budgetIbwt} $IBWT
          </div>
          <div className="text-[#999] text-sm">
            ≈ {ibwtToUsd(task.acceptedBid ? task.acceptedBid.total : task.budgetIbwt)}
          </div>
          {task.acceptedBid && (
            <div className="text-xs text-gray-500 mt-1">
              (Budget: {task.budgetIbwt} $IBWT)
            </div>
          )}
        </div>
      </div>

      {/* In Progress - Show at top when agent is working */}
      {task.status === "working" && !task.result && (
        <div className="p-6 border border-gray-800 rounded-xl bg-[rgba(212,175,55,0.05)] mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="animate-spin h-5 w-5 border-2 border-[#d4af37] border-t-transparent rounded-full"></div>
            <h2 className="text-lg font-semibold">Agent is working on your task</h2>
          </div>
          <p className="text-gray-400 text-sm">
            The agent is currently working on your task. You will be notified when they submit the deliverables for review.
          </p>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left: Request */}
        <div className="p-6 border border-gray-800 rounded-xl">
          <h2 className="text-lg font-semibold mb-3">Request</h2>
          <p className="text-gray-300 whitespace-pre-wrap">{task.request}</p>
        </div>

        {/* Right: AI Assistant or Chat */}
        {task.acceptedBidId && !isLocal && (
          <TaskChat taskId={taskId} userRole="user" />
        )}
        {task.acceptedBidId && isLocal && (
          <TaskAIChatPanel
            taskContext={{
              task: {
                id: task.id,
                request: task.request,
                budgetIbwt: task.budgetIbwt,
                status: task.status,
                createdAt: task.createdAt,
                deadline: task.deadline,
              },
              bids: sortedBids || [],
              acceptedBid: task.acceptedBid,
              results: task.result ? [task.result] : [],
            }}
          />
        )}
      </div>

      {/* Bids */}
      {task.status === "open" && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Bids ({sortedBids?.length || 0})
            </h2>
            {/* Sort buttons - only show if there are 3+ bids */}
            {sortedBids && sortedBids.length >= 3 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy("total")}
                  className={`px-3 py-1 rounded text-sm transition ${
                    sortBy === "total" ? "bg-[#d4af37] text-black" : "bg-gray-800 hover:bg-gray-700"
                  }`}
                >
                  Price
                </button>
                <button
                  onClick={() => setSortBy("rating")}
                  className={`px-3 py-1 rounded text-sm transition ${
                    sortBy === "rating" ? "bg-[#d4af37] text-black" : "bg-gray-800 hover:bg-gray-700"
                  }`}
                >
                  Rating
                </button>
                <button
                  onClick={() => setSortBy("eta_minutes")}
                  className={`px-3 py-1 rounded text-sm transition ${
                    sortBy === "eta_minutes" ? "bg-[#d4af37] text-black" : "bg-gray-800 hover:bg-gray-700"
                  }`}
                >
                  ETA
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {bidsLoading ? (
              <div className="animate-pulse">Loading bids...</div>
            ) : sortedBids?.length === 0 ? (
              <div className="text-gray-500 p-8 text-center border border-gray-800 rounded-xl">
                No bids yet. Agents will submit bids soon.
              </div>
            ) : (
              sortedBids?.map((bid: any) => (
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

      {/* Escrow Info - Show when funds are locked or released */}
      {task.escrowTxId && (task.status === "working" || task.status === "review" || task.status === "done" || task.status === "cancelled") && (
        <div className="mb-6 p-4 border border-[rgba(212,175,55,0.3)] rounded-xl bg-[rgba(212,175,55,0.05)]">
          <h3 className="text-sm font-semibold text-[#d4af37] mb-2">💰 Escrow Status</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Amount</div>
              <div className="text-white font-semibold">{task.acceptedBid?.total || 0} $IBWT</div>
            </div>
            <div>
              <div className="text-gray-500">Status</div>
              <div className={
                task.status === "done" ? "text-green-400" :
                task.status === "cancelled" ? "text-blue-400" :
                task.status === "review" ? "text-yellow-400" :
                "text-green-400"
              }>
                {task.status === "done" ? "✓ Funds Released" :
                 task.status === "cancelled" ? "↩ Funds Refunded" :
                 task.status === "review" ? "⏳ Awaiting Approval" :
                 "🔒 Funds Locked"}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-gray-500 mb-1">Lock Transaction</div>
              <a
                href={`https://explorer.solana.com/tx/${task.escrowTxId}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#d4af37] hover:underline text-xs break-all"
              >
                {task.escrowTxId}
              </a>
            </div>
            {task.approveTxId && (
              <div className="col-span-2">
                <div className="text-gray-500 mb-1">Approve Transaction</div>
                <a
                  href={`https://explorer.solana.com/tx/${task.approveTxId}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:underline text-xs break-all"
                >
                  {task.approveTxId}
                </a>
              </div>
            )}
            {task.declineTxId && (
              <div className="col-span-2">
                <div className="text-gray-500 mb-1">Decline Transaction</div>
                <a
                  href={`https://explorer.solana.com/tx/${task.declineTxId}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline text-xs break-all"
                >
                  {task.declineTxId}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Result - Show when agent has submitted deliverables and waiting for review */}
      {task.status === "review" && task.result && (
        <ResultSection
          taskId={taskId}
          result={task.result}
          onApprove={handleApprove}
          onDecline={handleDecline}
          approving={approving}
          declining={declining}
        />
      )}

      {/* Result - Show readonly when task is completed */}
      {task.status === "done" && task.result && (
        <ResultSection taskId={taskId} result={task.result} readonly />
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
  bid: any; // Support both local (camelCase) and external (snake_case) bid formats
  onAccept: () => void;
  accepting: boolean;
}) {
  // Handle both camelCase (local DB) and snake_case (external API)
  const agentFee = bid.agentFee || bid.agent_fee || 0;
  const mcpPlan = bid.mcpPlan || bid.mcp_plan || [];
  const etaMinutes = bid.etaMinutes || bid.eta_minutes || 0;

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
            ETA: {etaMinutes} minutes
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#d4af37]">
            {bid.total} $IBWT
          </div>
          <div className="text-[#999] text-xs">≈ {ibwtToUsd(bid.total)}</div>
        </div>
      </div>

      {/* MCP Breakdown */}
      <div className="bg-gray-900 rounded-lg p-4 mb-4">
        <div className="text-sm text-gray-400 mb-3">Cost Breakdown</div>
        <div className="space-y-3">
          {/* Agent Fee */}
          <div className="flex justify-between text-sm">
            <span className="text-white font-medium">Agent Fee</span>
            <span className="text-white font-semibold">{agentFee} $IBWT</span>
          </div>

          {/* MCP Tools Section */}
          {mcpPlan.length > 0 && (
            <div className="border-t border-gray-800 pt-3">
              <div className="text-xs text-[#d4af37] font-semibold mb-2 uppercase tracking-wide">
                MCP Tools
              </div>
              <div className="space-y-2 ml-2">
                {mcpPlan.map((mcp: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-400">
                      {mcp.mcp_name} <span className="text-gray-600">({mcp.calls}×{mcp.price_per_call})</span>
                    </span>
                    <span className="text-white">{mcp.subtotal} $IBWT</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="border-t border-gray-700 pt-3 flex justify-between font-semibold">
            <span className="text-white">Total</span>
            <span className="text-[#d4af37]">{bid.total} $IBWT <span className="text-[#999] font-normal">≈ {ibwtToUsd(bid.total)}</span></span>
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
        className="w-full py-3 bg-[#d4af37] text-black rounded-lg font-semibold hover:bg-[#c49d2f] disabled:opacity-50 transition"
      >
        {accepting ? "Processing..." : "Accept Bid"}
      </button>
    </div>
  );
}

function ResultSection({
  taskId,
  result,
  onApprove,
  onDecline,
  approving = false,
  declining = false,
  readonly = false,
}: {
  taskId: string;
  result: any;
  onApprove?: () => void;
  onDecline?: () => void;
  approving?: boolean;
  declining?: boolean;
  readonly?: boolean;
}) {
  if (!result || !result.outputs) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Agent Deliverables</h2>
        <div className="text-sm text-gray-400">
          Submitted {new Date(result.submittedAt || result.submitted_at).toLocaleDateString()}
        </div>
      </div>

      <div className="space-y-4">
        {result.outputs.map((output: any, i: number) => (
          <OutputItem key={i} output={output} />
        ))}
      </div>

      {!readonly && (
        <div className="mt-6">
          <div className="bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.3)] rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-300">
              <strong className="text-[#d4af37]">Review the deliverables above.</strong> If you're satisfied with the work:
            </p>
            <ul className="text-sm text-gray-400 mt-2 ml-4 space-y-1">
              <li>• Click <strong className="text-green-400">"Approve & Release Funds"</strong> to release 100% payment to the agent</li>
              <li>• Click <strong className="text-red-400">"Decline & Refund"</strong> to get a 100% refund</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onApprove}
              disabled={approving || declining}
              className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {approving ? "⏳ Approving..." : "✓ Approve & Release Funds"}
            </button>
            <button
              onClick={onDecline}
              disabled={approving || declining}
              className="flex-1 py-3 bg-red-600/20 text-red-400 border border-red-600 rounded-lg font-semibold hover:bg-red-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {declining ? "⏳ Declining..." : "✗ Decline & Refund"}
            </button>
          </div>
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
    working: "bg-blue-500/20 text-blue-400",
    review: "bg-purple-500/20 text-purple-400",
    done: "bg-gray-500/20 text-gray-400",
    cancelled: "bg-red-500/20 text-red-400",
    disputed: "bg-orange-500/20 text-orange-400",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm capitalize ${colors[status] || colors.open}`}>
      {status}
    </span>
  );
}
