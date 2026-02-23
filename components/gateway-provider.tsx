"use client";

import { useEffect, useRef, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useGatewayStore } from "@/lib/gateway-store";
import { gateway } from "@/lib/api";

export function GatewayProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, signMessage, connected } = useWallet();
  const { apiKey, isConnecting, connect, disconnect, hydrate } =
    useGatewayStore();
  const hasTriedConnect = useRef(false);

  // Handle 401: clear stale key so auto-connect re-triggers
  const handleUnauthorized = useCallback(() => {
    hasTriedConnect.current = false;
    disconnect();
  }, [disconnect]);

  // Wire up 401 callback
  useEffect(() => {
    gateway.setOnUnauthorized(handleUnauthorized);
    return () => gateway.setOnUnauthorized(null);
  }, [handleUnauthorized]);

  // Hydrate token on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Auto-connect when wallet connects (or after 401 clears the key)
  useEffect(() => {
    if (connected && publicKey && signMessage && !apiKey && !isConnecting) {
      if (hasTriedConnect.current) return;
      hasTriedConnect.current = true;
      connect(publicKey.toBase58(), signMessage);
    }
  }, [connected, publicKey, signMessage, apiKey, isConnecting, connect]);

  // Disconnect when wallet disconnects
  useEffect(() => {
    if (!connected && apiKey) {
      hasTriedConnect.current = false;
      disconnect();
    }
  }, [connected, apiKey, disconnect]);

  // Reset retry flag when wallet changes
  useEffect(() => {
    hasTriedConnect.current = false;
  }, [publicKey?.toBase58()]);

  return <>{children}</>;
}
