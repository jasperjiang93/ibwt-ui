"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useGatewayStore } from "@/lib/gateway-store";
import { gateway } from "@/lib/api";

export function GatewayProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, signMessage, connected } = useWallet();
  const { apiKey, isConnecting, connect, disconnect } =
    useGatewayStore();
  const hasTriedConnect = useRef(false);
  const disconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isHandling401 = useRef(false);

  // Track zustand persist hydration via built-in API
  const [hydrated, setHydrated] = useState(
    useGatewayStore.persist.hasHydrated()
  );

  useEffect(() => {
    const unsub = useGatewayStore.persist.onFinishHydration(() =>
      setHydrated(true)
    );
    return unsub;
  }, []);

  // Handle 401: clear stale key so auto-connect re-triggers
  const handleUnauthorized = useCallback(() => {
    if (isHandling401.current) return;
    isHandling401.current = true;
    hasTriedConnect.current = false;
    disconnect();
    setTimeout(() => { isHandling401.current = false; }, 2000);
  }, [disconnect]);

  // Wire up 401 callback
  useEffect(() => {
    gateway.setOnUnauthorized(handleUnauthorized);
    return () => gateway.setOnUnauthorized(null);
  }, [handleUnauthorized]);

  // Auto-connect when wallet connects (or after 401 clears the key)
  useEffect(() => {
    if (!hydrated) return;
    if (connected && publicKey && signMessage && !apiKey && !isConnecting) {
      if (hasTriedConnect.current) return;
      hasTriedConnect.current = true;
      connect(publicKey.toBase58(), signMessage);
    }
  }, [hydrated, connected, publicKey, signMessage, apiKey, isConnecting, connect]);

  // Disconnect when wallet disconnects (debounced to ignore brief flickers)
  useEffect(() => {
    if (!connected && apiKey) {
      disconnectTimer.current = setTimeout(() => {
        hasTriedConnect.current = false;
        disconnect();
      }, 500);
    }
    return () => clearTimeout(disconnectTimer.current);
  }, [connected, apiKey, disconnect]);

  // Reset retry flag when wallet changes
  useEffect(() => {
    hasTriedConnect.current = false;
  }, [publicKey?.toBase58()]);

  return <>{children}</>;
}
