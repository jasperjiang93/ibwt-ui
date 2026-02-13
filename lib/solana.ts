import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

// Network config
export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
export const SOLANA_RPC_URL = 
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 
  clusterApiUrl(SOLANA_NETWORK as "devnet" | "mainnet-beta");

// Token addresses
export const IBWT_TOKEN_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_IBWT_TOKEN_MINT || 
  "Co4KTCKPdAnFhJWNUbPdCn3VFF5xSATaxXpPaGVepump"
);

// Escrow program (replace after deploy)
export const ESCROW_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_ESCROW_PROGRAM_ID || 
  "11111111111111111111111111111111"
);

// Connection singleton
let connection: Connection | null = null;

export function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(SOLANA_RPC_URL, "confirmed");
  }
  return connection;
}

// Verify wallet signature
export async function verifyWalletSignature(
  publicKey: string,
  message: string,
  signature: Uint8Array
): Promise<boolean> {
  const { sign } = await import("tweetnacl");
  const pk = new PublicKey(publicKey);
  const messageBytes = new TextEncoder().encode(message);
  
  return sign.detached.verify(messageBytes, signature, pk.toBytes());
}
