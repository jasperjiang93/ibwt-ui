import { clusterApiUrl } from "@solana/web3.js";

// Master switch: "testnet" or "mainnet"
export type Network = "testnet" | "mainnet";
export const NETWORK: Network =
  (process.env.NEXT_PUBLIC_NETWORK as Network) || "testnet";

export const IS_MAINNET = NETWORK === "mainnet";

// Solana network identifier (for wallet adapter)
export type SolanaNetwork = "devnet" | "mainnet-beta";
export const SOLANA_NETWORK: SolanaNetwork = IS_MAINNET ? "mainnet-beta" : "devnet";

// Pick env var by network suffix
function envByNetwork(base: string, fallback: string): string {
  const suffix = IS_MAINNET ? "_MAINNET" : "_TESTNET";
  return process.env[`NEXT_PUBLIC_${base}${suffix}`] || fallback;
}

// RPC
export const RPC_URL = envByNetwork(
  "SOLANA_RPC_URL",
  clusterApiUrl(SOLANA_NETWORK),
);

// Contracts
export const IBWT_MINT = envByNetwork(
  "IBWT_TOKEN_MINT",
  IS_MAINNET
    ? "Co4KTCKPdAnFhJWNUbPdCn3VFF5xSATaxXpPaGVepump"
    : "9rq5Nx45W9ku1bp31tctn7ynoTKQBaEDtzv6VQxfBd9B",
);

export const TREASURY_WALLET = envByNetwork(
  "TREASURY_WALLET",
  IS_MAINNET ? "" : "CqG2enYhFVySUJMs6ywwz2hc9K1BeNtFuE4e1oKhUYh7",
);

// Mainnet IBWT mint (always used for price lookup on DexScreener)
export const MAINNET_IBWT_MINT = "Co4KTCKPdAnFhJWNUbPdCn3VFF5xSATaxXpPaGVepump";

// Explorer
const EXPLORER_BASE = "https://explorer.solana.com";
const EXPLORER_CLUSTER = IS_MAINNET ? "" : "?cluster=devnet";

export function explorerTxUrl(signature: string): string {
  return `${EXPLORER_BASE}/tx/${signature}${EXPLORER_CLUSTER}`;
}

export function explorerAddressUrl(address: string): string {
  return `${EXPLORER_BASE}/address/${address}${EXPLORER_CLUSTER}`;
}
