"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function WalletButton() {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleConnect = useCallback(() => {
    setVisible(true);
  }, [setVisible]);

  const handleDisconnect = useCallback(async () => {
    setOpen(false);
    await disconnect();
    router.push("/");
  }, [disconnect, router]);

  const handleCopy = useCallback(() => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setOpen(false);
    }
  }, [publicKey]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  if (connected && publicKey) {
    const addr = publicKey.toBase58();
    const short = addr.slice(0, 4) + "..." + addr.slice(-4);

    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="px-4 py-2 bg-[rgba(212,175,55,0.15)] text-[#d4af37] border border-[rgba(212,175,55,0.3)] rounded-lg text-sm font-medium hover:bg-[rgba(212,175,55,0.25)] transition"
        >
          {short}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a24] border border-[rgba(212,175,55,0.2)] rounded-lg shadow-xl overflow-hidden z-50">
            <button
              onClick={handleCopy}
              className="w-full px-4 py-3 text-sm text-left text-[#e5e5e5] hover:bg-[rgba(255,255,255,0.05)] transition"
            >
              Copy Address
            </button>
            <button
              onClick={handleDisconnect}
              className="w-full px-4 py-3 text-sm text-left text-red-400 hover:bg-[rgba(255,255,255,0.05)] transition border-t border-gray-800"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="px-4 py-2 bg-[rgba(212,175,55,0.15)] text-[#d4af37] border border-[rgba(212,175,55,0.3)] rounded-lg text-sm font-medium hover:bg-[rgba(212,175,55,0.25)] transition"
    >
      Connect Wallet
    </button>
  );
}
