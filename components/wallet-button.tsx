"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useCallback } from "react";

export function WalletButton() {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const handleConnect = useCallback(() => {
    setVisible(true);
  }, [setVisible]);

  if (connected && publicKey) {
    const addr = publicKey.toBase58();
    const short = addr.slice(0, 4) + "..." + addr.slice(-4);
    return (
      <button
        onClick={() => disconnect()}
        className="px-4 py-2 bg-[rgba(212,175,55,0.15)] text-[#d4af37] border border-[rgba(212,175,55,0.3)] rounded-lg text-sm font-medium hover:bg-[rgba(212,175,55,0.25)] transition"
      >
        {short}
      </button>
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
