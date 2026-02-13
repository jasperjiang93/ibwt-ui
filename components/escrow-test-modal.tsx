"use client";

import { useState, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import {
  buildLockFundsTransaction,
  generateTaskId,
  taskIdToHex,
} from "@/lib/escrow";
import { IBWT_TOKEN_MINT, ESCROW_PROGRAM_ID } from "@/lib/solana";

export function EscrowTestModal({ onClose }: { onClose: () => void }) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testAmount = 100;

  // Pre-compute all the addresses
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

  const handleConfirm = async () => {
    setStatus("sending");
    setError(null);

    try {
      const tx = await buildLockFundsTransaction({
        connection,
        user: publicKey,
        agent: publicKey, // send to self for testing
        taskId: params.taskId,
        amount: testAmount,
      });

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");

      setTxSignature(signature);
      setStatus("success");
    } catch (err) {
      console.error("Escrow test failed:", err);
      setError(err instanceof Error ? err.message : "Transaction failed");
      setStatus("error");
    }
  };

  const rows = [
    ["Program", short(ESCROW_PROGRAM_ID)],
    ["Mint ($IBWT)", short(IBWT_TOKEN_MINT)],
    ["User (signer)", short(publicKey)],
    ["Agent (self)", short(publicKey)],
    ["Task ID", taskIdToHex(params.taskId).slice(0, 16) + "..."],
    ["Escrow PDA", short(params.escrowPda)],
    ["User ATA", short(params.userAta)],
    ["Escrow ATA", short(params.escrowAta)],
    ["Amount", `${testAmount} $IBWT`],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-[#12121a] border border-[rgba(212,175,55,0.2)] rounded-xl p-6">
        <h2 className="text-xl font-bold text-[#e5e5e5] mb-1">
          Test Escrow: lock_funds
        </h2>
        <p className="text-sm text-[#888] mb-6">
          This will send {testAmount} $IBWT from your wallet to an escrow PDA.
          Agent is set to yourself for testing.
        </p>

        {/* Parameter table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label} className="border-b border-[rgba(255,255,255,0.05)]">
                  <td className="py-2 pr-4 text-[#888] whitespace-nowrap">{label}</td>
                  <td className="py-2 font-mono text-[#d4af37] text-xs">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Status messages */}
        {status === "success" && txSignature && (
          <div className="mb-4 p-3 bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] rounded-lg text-sm">
            <div className="text-green-400 font-semibold mb-1">Transaction confirmed!</div>
            <div className="font-mono text-xs text-[#888] break-all">{txSignature}</div>
          </div>
        )}

        {status === "error" && error && (
          <div className="mb-4 p-3 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-lg text-sm">
            <div className="text-red-400 font-semibold mb-1">Transaction failed</div>
            <div className="text-xs text-[#888]">{error}</div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-[rgba(212,175,55,0.2)] rounded-lg text-[#888] hover:text-[#e5e5e5] hover:border-[rgba(212,175,55,0.4)] transition"
          >
            {status === "success" ? "Close" : "Cancel"}
          </button>
          {status !== "success" && (
            <button
              onClick={handleConfirm}
              disabled={status === "sending"}
              className="px-4 py-2 text-sm bg-[#d4af37] text-black font-semibold rounded-lg hover:bg-[#e5c04b] disabled:opacity-50 transition"
            >
              {status === "sending" ? "Signing..." : "Confirm & Sign"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
