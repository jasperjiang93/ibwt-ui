import { Connection, clusterApiUrl } from "@solana/web3.js";

// Network config
export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  clusterApiUrl(SOLANA_NETWORK as "devnet" | "mainnet-beta");

// Connection singleton
let connection: Connection | null = null;

export function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(SOLANA_RPC_URL, "confirmed");
  }
  return connection;
}
