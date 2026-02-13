"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { WaitlistModal } from "@/components/waitlist-modal";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useCallback } from "react";

const isLocal = process.env.NEXT_PUBLIC_ENV === "local";

export default function SignInPage() {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();

  const handleConnect = useCallback(() => {
    setVisible(true);
  }, [setVisible]);

  if (!isLocal) {
    return (
      <>
        <Nav />
        <main className="pt-24 min-h-screen flex items-center justify-center px-6">
          <WaitlistModal open={true} onClose={() => router.push("/")} />
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />

      <main className="pt-24 min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="card p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="text-3xl font-bold text-gold-gradient mb-4">
                IBWT
              </div>
              <h1 className="text-xl">Welcome back</h1>
              <p className="text-[#888] text-sm mt-2">
                Connect your Phantom wallet to continue
              </p>
            </div>

            {/* Phantom Wallet */}
            {connected && publicKey ? (
              <div className="text-center space-y-4">
                <div className="px-4 py-3 bg-[rgba(212,175,55,0.05)] border border-[rgba(212,175,55,0.2)] rounded-lg font-mono text-sm text-[#888]">
                  {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}
                </div>
                <div className="flex gap-3 justify-center">
                  <Link href="/dashboard" className="btn-primary">
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={() => disconnect()}
                    className="px-4 py-2 text-[#888] hover:text-[#e5e5e5] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm transition"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[rgba(171,113,248,0.15)] border border-[rgba(171,113,248,0.4)] rounded-lg hover:bg-[rgba(171,113,248,0.25)] transition group"
              >
                {/* Phantom logo */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <span className="text-[#ab71f8] group-hover:text-[#c49bff] font-medium transition">
                  Connect Wallet
                </span>
              </button>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-[#666] text-sm mt-6">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-[#d4af37] hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-[#d4af37] hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
