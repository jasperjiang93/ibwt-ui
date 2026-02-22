"use client";

import { useState, useEffect, use } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import Link from "next/link";

interface Payment {
  id: string;
  status: string;
  amountUsd: number;
  amountSol: number | null;
  amountUsdc: number | null;
  currency: string;
  solanaPayUrl: string;
  recipientWallet: string;
  description: string | null;
  expiresAt: string;
  confirmedAt: string | null;
  merchant: {
    name: string | null;
    wallet: string;
  };
}

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  useEffect(() => {
    fetchPayment();
    // Poll for status updates
    const interval = setInterval(fetchPayment, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchPayment = async () => {
    try {
      const res = await fetch(`/api/payment/${id}`);
      if (!res.ok) throw new Error("Payment not found");
      const data = await res.json();
      setPayment(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payment");
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!publicKey || !payment) return;
    
    setPaying(true);
    setError(null);

    try {
      // For Solana Pay, we need to parse the URL and create a transaction
      // This is a simplified version - in production, use @solana/pay properly
      
      const { Transaction, SystemProgram, PublicKey: SolanaPublicKey, LAMPORTS_PER_SOL } = await import("@solana/web3.js");
      
      const recipientPubkey = new SolanaPublicKey(payment.recipientWallet);
      const amountLamports = Math.floor((payment.amountSol || 0) * LAMPORTS_PER_SOL);
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports: amountLamports,
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      setTxSignature(signature);

      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");

      // Verify with our API
      const verifyRes = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: payment.id,
          txSignature: signature,
        }),
      });

      if (!verifyRes.ok) {
        throw new Error("Failed to verify payment");
      }

      // Refresh payment status
      await fetchPayment();
    } catch (err) {
      console.error("Payment error:", err);
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const getTimeRemaining = () => {
    if (!payment) return null;
    const expires = new Date(payment.expiresAt).getTime();
    const now = Date.now();
    const diff = expires - now;
    
    if (diff <= 0) return "Expired";
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <>
        <Nav />
        <main className="pt-24 pb-12 px-6 min-h-screen">
          <div className="max-w-md mx-auto text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-[#888]">Loading payment...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error && !payment) {
    return (
      <>
        <Nav />
        <main className="pt-24 pb-12 px-6 min-h-screen">
          <div className="max-w-md mx-auto text-center py-12">
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-xl font-semibold mb-2">Payment Not Found</h2>
            <p className="text-[#888] mb-6">{error}</p>
            <Link href="/" className="btn-primary">
              Go Home
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!payment) return null;

  // Confirmed state
  if (payment.status === "confirmed") {
    return (
      <>
        <Nav />
        <main className="pt-24 pb-12 px-6 min-h-screen">
          <div className="max-w-md mx-auto">
            <div className="card p-8 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-2xl font-bold mb-2 text-green-400">Payment Confirmed!</h1>
              <p className="text-[#888] mb-6">
                Your payment of ${payment.amountUsd.toFixed(2)} has been confirmed.
              </p>
              
              <div className="bg-[rgba(0,0,0,0.3)] p-4 rounded-lg mb-6 text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-[#888]">Amount</span>
                  <span>${payment.amountUsd.toFixed(2)} ({payment.amountSol?.toFixed(4)} SOL)</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-[#888]">To</span>
                  <span>{payment.merchant.name || payment.merchant.wallet.slice(0, 12)}...</span>
                </div>
                {payment.description && (
                  <div className="flex justify-between">
                    <span className="text-[#888]">For</span>
                    <span>{payment.description}</span>
                  </div>
                )}
              </div>

              <Link href="/" className="btn-primary">
                Done
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Expired state
  if (payment.status === "expired") {
    return (
      <>
        <Nav />
        <main className="pt-24 pb-12 px-6 min-h-screen">
          <div className="max-w-md mx-auto">
            <div className="card p-8 text-center">
              <div className="text-6xl mb-4">⏰</div>
              <h1 className="text-2xl font-bold mb-2 text-red-400">Payment Expired</h1>
              <p className="text-[#888] mb-6">
                This payment request has expired. Please request a new payment.
              </p>
              <Link href="/" className="btn-primary">
                Go Home
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Pending state - show payment form
  return (
    <>
      <Nav />
      <main className="pt-24 pb-12 px-6 min-h-screen">
        <div className="max-w-md mx-auto">
          <div className="card p-6">
            <h1 className="text-xl font-bold mb-2 text-center">Complete Payment</h1>
            <p className="text-[#888] text-center mb-6">
              Pay with SOL via your connected wallet
            </p>

            {/* Amount */}
            <div className="bg-[rgba(0,0,0,0.3)] p-6 rounded-lg mb-6 text-center">
              <div className="text-4xl font-bold text-[#d4af37] mb-1">
                ${payment.amountUsd.toFixed(2)}
              </div>
              <div className="text-[#888]">
                ≈ {payment.amountSol?.toFixed(4)} SOL
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-[#888]">To</span>
                <span>{payment.merchant.name || payment.recipientWallet.slice(0, 12)}...</span>
              </div>
              {payment.description && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#888]">For</span>
                  <span>{payment.description}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[#888]">Expires in</span>
                <span className="text-orange-400">{getTimeRemaining()}</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            {/* Transaction Status */}
            {txSignature && payment.status !== "confirmed" && (
              <div className="bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.3)] px-4 py-3 rounded-lg mb-4 text-sm">
                <p className="text-[#d4af37] mb-1">Transaction submitted!</p>
                <p className="text-[#888] text-xs break-all">{txSignature}</p>
              </div>
            )}

            {/* Pay Button */}
            {!publicKey ? (
              <div className="text-center">
                <p className="text-[#888] mb-4">Connect your wallet to pay</p>
                {/* Wallet button will be in Nav */}
              </div>
            ) : (
              <button
                onClick={handlePay}
                disabled={paying || payment.status !== "pending"}
                className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paying ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Processing...
                  </span>
                ) : (
                  `Pay ${payment.amountSol?.toFixed(4)} SOL`
                )}
              </button>
            )}

            {/* QR Code Alternative */}
            <div className="mt-6 pt-6 border-t border-[rgba(212,175,55,0.1)] text-center">
              <p className="text-sm text-[#888] mb-3">Or scan with Phantom/Solflare:</p>
              <div className="inline-block p-4 bg-white rounded-lg">
                {/* QR Code would go here */}
                <div className="w-32 h-32 bg-[#f0f0f0] flex items-center justify-center text-[#888] text-sm">
                  QR Code
                </div>
              </div>
              <p className="text-xs text-[#666] mt-2 break-all max-w-full overflow-hidden">
                {payment.solanaPayUrl.slice(0, 50)}...
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
