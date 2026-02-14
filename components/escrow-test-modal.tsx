"use client";

import { useState, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import {
  buildLockFundsTransaction,
  buildSubmitResultTransaction,
  buildApproveTransaction,
  buildDeclineTransaction,
  generateTaskId,
  taskIdToHex,
} from "@/lib/escrow";
import { IBWT_TOKEN_MINT, ESCROW_PROGRAM_ID } from "@/lib/solana";

type Step = "lock" | "submit" | "review" | "done";

export function EscrowTestModal({ onClose }: { onClose: () => void }) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [step, setStep] = useState<Step>("lock");
  const [sending, setSending] = useState(false);
  const [lastTx, setLastTx] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testAmount = 100000;

  const params = useMemo(() => {
    if (!publicKey) return null;
    const taskId = generateTaskId();
    const [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from(taskId)],
      ESCROW_PROGRAM_ID
    );
    const userAta = getAssociatedTokenAddressSync(IBWT_TOKEN_MINT, publicKey);
    const escrowAta = getAssociatedTokenAddressSync(IBWT_TOKEN_MINT, escrowPda, true);
    return { taskId, escrowPda, userAta, escrowAta };
  }, [publicKey]);

  if (!publicKey || !params) return null;

  const short = (pk: PublicKey) =>
    `${pk.toBase58().slice(0, 6)}...${pk.toBase58().slice(-4)}`;

  const sendTx = async (buildFn: () => Promise<import("@solana/web3.js").Transaction>, nextStep: Step) => {
    setSending(true);
    setError(null);
    setLastTx(null);
    try {
      const tx = await buildFn();
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");
      setLastTx(signature);
      setStep(nextStep);
    } catch (err: unknown) {
      console.error(`Step ${step} failed:`, err);
      let msg = "Transaction failed";
      if (err instanceof Error) {
        msg = err.message;
        const logs = (err as unknown as Record<string, unknown>).logs as string[] | undefined;
        if (logs) {
          console.error("Program logs:", logs);
          msg += "\n\nLogs:\n" + logs.join("\n");
        }
      }
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  const [outcome, setOutcome] = useState<"approved" | "declined" | null>(null);

  const handleStep = () => {
    switch (step) {
      case "lock":
        return sendTx(
          () => buildLockFundsTransaction({ connection, user: publicKey, agent: publicKey, taskId: params.taskId, amount: testAmount, deadline: Math.floor(Date.now() / 1000) + 3600 }),
          "submit"
        );
      case "submit":
        return sendTx(
          () => buildSubmitResultTransaction({ connection, agent: publicKey, taskId: params.taskId }),
          "review"
        );
    }
  };

  const handleApprove = () => {
    setOutcome("approved");
    return sendTx(
      () => buildApproveTransaction({ connection, user: publicKey, agent: publicKey, taskId: params.taskId }),
      "done"
    );
  };

  const handleDecline = () => {
    setOutcome("declined");
    return sendTx(
      () => buildDeclineTransaction({ connection, user: publicKey, taskId: params.taskId }),
      "done"
    );
  };

  const steps: { key: Step; label: string }[] = [
    { key: "lock", label: "1. Lock Funds" },
    { key: "submit", label: "2. Submit Result" },
    { key: "review", label: "3. Review" },
    { key: "done", label: "Done" },
  ];

  const currentIdx = steps.findIndex((s) => s.key === step);

  const buttonLabel: Record<Step, string> = {
    lock: "Lock Funds",
    submit: "Submit Result",
    review: "",
    done: "",
  };

  const rows = [
    ["Program", short(ESCROW_PROGRAM_ID)],
    ["Mint ($IBWT)", short(IBWT_TOKEN_MINT)],
    ["User / Agent", short(publicKey)],
    ["Task ID", taskIdToHex(params.taskId).slice(0, 16) + "..."],
    ["Escrow PDA", short(params.escrowPda)],
    ["Amount", `${testAmount} $IBWT`],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-[#12121a] border border-[rgba(212,175,55,0.2)] rounded-xl p-6">
        <h2 className="text-xl font-bold text-[#e5e5e5] mb-1">
          Test Escrow Flow
        </h2>
        <p className="text-sm text-[#888] mb-5">
          Full cycle: lock → submit → approve / decline. All signed by your wallet.
        </p>

        {/* Step indicator */}
        <div className="flex gap-1 mb-6">
          {steps.slice(0, 3).map((s, i) => (
            <div key={s.key} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  i < currentIdx
                    ? "bg-green-500"
                    : i === currentIdx
                    ? "bg-[#d4af37]"
                    : "bg-[rgba(255,255,255,0.1)]"
                }`}
              />
              <div className={`text-xs mt-1.5 ${i === currentIdx ? "text-[#d4af37]" : i < currentIdx ? "text-green-500" : "text-[#555]"}`}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Parameter table */}
        <div className="overflow-x-auto mb-5">
          <table className="w-full text-sm">
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label} className="border-b border-[rgba(255,255,255,0.05)]">
                  <td className="py-1.5 pr-4 text-[#888] whitespace-nowrap">{label}</td>
                  <td className="py-1.5 font-mono text-[#d4af37] text-xs">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Last tx */}
        {lastTx && (
          <div className="mb-4 p-3 bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] rounded-lg text-sm">
            <div className="text-green-400 font-semibold mb-1">
              {step === "done"
                ? outcome === "declined"
                  ? "Declined — funds refunded!"
                  : "Approved — funds released!"
                : `Step ${currentIdx} confirmed!`}
            </div>
            <div className="font-mono text-xs text-[#888] break-all">{lastTx}</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-lg text-sm">
            <div className="text-red-400 font-semibold mb-1">Transaction failed</div>
            <div className="text-xs text-[#888] whitespace-pre-wrap break-all max-h-48 overflow-y-auto font-mono">{error}</div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-[rgba(212,175,55,0.2)] rounded-lg text-[#888] hover:text-[#e5e5e5] hover:border-[rgba(212,175,55,0.4)] transition"
          >
            {step === "done" ? "Close" : "Cancel"}
          </button>

          {/* Lock & Submit steps */}
          {(step === "lock" || step === "submit") && (
            <button
              onClick={handleStep}
              disabled={sending}
              className="px-4 py-2 text-sm bg-[#d4af37] text-black font-semibold rounded-lg hover:bg-[#e5c04b] disabled:opacity-50 transition"
            >
              {sending ? "Signing..." : buttonLabel[step]}
            </button>
          )}

          {/* Review step — approve or decline */}
          {step === "review" && (
            <>
              <button
                onClick={handleDecline}
                disabled={sending}
                className="px-4 py-2 text-sm border border-red-500/50 text-red-400 font-semibold rounded-lg hover:bg-red-500/10 disabled:opacity-50 transition"
              >
                {sending && outcome === "declined" ? "Signing..." : "Decline & Refund"}
              </button>
              <button
                onClick={handleApprove}
                disabled={sending}
                className="px-4 py-2 text-sm bg-[#d4af37] text-black font-semibold rounded-lg hover:bg-[#e5c04b] disabled:opacity-50 transition"
              >
                {sending && outcome === "approved" ? "Signing..." : "Approve & Pay"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
