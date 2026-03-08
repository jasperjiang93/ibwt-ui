import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { gateway } from "./api";
import bs58 from "bs58";

interface GatewayState {
  apiKey: string | null;
  isConnecting: boolean;
  error: string | null;

  connect: (
    walletAddress: string,
    signMessage: (message: Uint8Array) => Promise<Uint8Array>
  ) => Promise<void>;
  disconnect: () => void;
}

export const useGatewayStore = create<GatewayState>()(
  persist(
    (set, get) => ({
      apiKey: null,
      isConnecting: false,
      error: null,

      connect: async (walletAddress, signMessage) => {
        // Prevent concurrent connect calls
        if (get().isConnecting) return;
        set({ isConnecting: true, error: null });
        try {
          // 1. Get challenge nonce from gateway
          const { nonce } = await gateway.challenge(walletAddress);

          // 2. Sign nonce with wallet
          const messageBytes = new TextEncoder().encode(nonce);
          const signatureBytes = await signMessage(messageBytes);
          const signature = bs58.encode(signatureBytes);

          // 3. Create API key
          const resp = await gateway.createKey({
            wallet_address: walletAddress,
            signature,
            nonce,
          });

          // 4. Set token on client and store
          const key = resp.api_key.key;
          gateway.setToken(key);
          set({
            apiKey: key,
            isConnecting: false,
            error: null,
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Connection failed";
          set({ isConnecting: false, error: message });
        }
      },

      disconnect: () => {
        gateway.setToken(null);
        set({
          apiKey: null,
          isConnecting: false,
          error: null,
        });
      },
    }),
    {
      name: "ibwt-gateway",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        apiKey: state.apiKey,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.apiKey) {
          gateway.setToken(state.apiKey);
        }
      },
    }
  )
);
