/**
 * Solana Transaction Listener
 * 
 * Monitors the blockchain for payment confirmations
 */

import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { prisma } from '@/lib/prisma';

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const POLL_INTERVAL_MS = 5000; // 5 seconds

interface PaymentConfirmation {
  paymentId: string;
  txSignature: string;
  confirmedAt: Date;
}

/**
 * Check pending payments and verify on-chain
 */
export async function checkPendingPayments(): Promise<PaymentConfirmation[]> {
  const confirmations: PaymentConfirmation[] = [];
  
  // Get all pending payments that haven't expired
  const pendingPayments = await prisma.payment.findMany({
    where: {
      status: 'pending',
      expiresAt: { gt: new Date() },
    },
    include: {
      merchant: true,
    },
    take: 100, // Process in batches
  });

  if (pendingPayments.length === 0) {
    return confirmations;
  }

  const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

  for (const payment of pendingPayments) {
    try {
      // Get recent transactions for the merchant wallet
      const recipientPubkey = new PublicKey(payment.recipientWallet);
      
      const signatures = await connection.getSignaturesForAddress(
        recipientPubkey,
        { limit: 20 },
        'confirmed'
      );

      for (const sig of signatures) {
        // Check if this transaction was after payment creation
        if (sig.blockTime && sig.blockTime * 1000 < payment.createdAt.getTime()) {
          continue;
        }

        // Get full transaction details
        const tx = await connection.getParsedTransaction(sig.signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });

        if (!tx || tx.meta?.err) {
          continue;
        }

        // Check if memo contains our payment ID
        const memoMatch = checkMemoForPaymentId(tx, payment.id);
        
        // Or check if amount matches (less reliable but useful as fallback)
        const amountMatch = checkTransactionAmount(
          tx,
          payment.recipientWallet,
          payment.currency === 'SOL' 
            ? Number(payment.amountSol) 
            : Number(payment.amountUsdc),
          payment.currency
        );

        if (memoMatch || amountMatch) {
          // Confirm payment
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'confirmed',
              txSignature: sig.signature,
              confirmedAt: new Date(),
            },
          });

          confirmations.push({
            paymentId: payment.id,
            txSignature: sig.signature,
            confirmedAt: new Date(),
          });

          // Send webhook notification
          if (payment.merchant.webhookUrl) {
            sendWebhook(payment.merchant.webhookUrl, payment.merchant.webhookSecret, {
              type: 'payment.confirmed',
              payment: {
                id: payment.id,
                amountUsd: Number(payment.amountUsd),
                currency: payment.currency,
                txSignature: sig.signature,
                metadata: payment.metadata,
              },
              timestamp: new Date().toISOString(),
            }).catch(console.error);
          }

          break; // Found matching transaction, move to next payment
        }
      }
    } catch (error) {
      console.error(`Error checking payment ${payment.id}:`, error);
    }
  }

  // Mark expired payments
  await prisma.payment.updateMany({
    where: {
      status: 'pending',
      expiresAt: { lt: new Date() },
    },
    data: {
      status: 'expired',
    },
  });

  return confirmations;
}

/**
 * Check if transaction memo contains our payment ID
 */
function checkMemoForPaymentId(
  tx: ParsedTransactionWithMeta,
  paymentId: string
): boolean {
  // Look for memo program instruction
  const instructions = tx.transaction.message.instructions;
  
  for (const ix of instructions) {
    if ('parsed' in ix && ix.program === 'spl-memo') {
      const memo = ix.parsed as string;
      if (memo.includes(`ibwt:${paymentId}`)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if transaction amount matches payment
 */
function checkTransactionAmount(
  tx: ParsedTransactionWithMeta,
  recipientWallet: string,
  expectedAmount: number,
  currency: string
): boolean {
  if (!tx.meta) return false;

  const recipientPubkey = new PublicKey(recipientWallet);
  const accountKeys = tx.transaction.message.accountKeys;
  
  // Find recipient account index
  const recipientIndex = accountKeys.findIndex(
    (key) => key.pubkey.equals(recipientPubkey)
  );

  if (recipientIndex === -1) return false;

  if (currency === 'SOL') {
    // Check SOL balance change
    const preBalance = tx.meta.preBalances[recipientIndex];
    const postBalance = tx.meta.postBalances[recipientIndex];
    const received = (postBalance - preBalance) / 1e9; // Convert lamports to SOL
    
    // Allow 1% tolerance for rounding
    return Math.abs(received - expectedAmount) / expectedAmount < 0.01;
  } else {
    // Check token balance change for USDC
    // This is more complex - would need to parse token account changes
    // For MVP, we'll rely on memo matching for USDC
    return false;
  }
}

/**
 * Send webhook notification
 */
async function sendWebhook(
  url: string,
  secret: string | null,
  payload: Record<string, unknown>
): Promise<void> {
  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  let signature = '';
  if (secret) {
    const crypto = await import('crypto');
    const signedPayload = `${timestamp}.${body}`;
    signature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');
  }

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-IBWT-Signature': signature,
      'X-IBWT-Timestamp': timestamp,
    },
    body,
  });
}

/**
 * Start the payment listener (for use in a background job)
 */
export function startPaymentListener(): NodeJS.Timeout {
  console.log('Starting payment listener...');
  
  const interval = setInterval(async () => {
    try {
      const confirmations = await checkPendingPayments();
      if (confirmations.length > 0) {
        console.log(`Confirmed ${confirmations.length} payments`);
      }
    } catch (error) {
      console.error('Payment listener error:', error);
    }
  }, POLL_INTERVAL_MS);

  return interval;
}

/**
 * Stop the payment listener
 */
export function stopPaymentListener(interval: NodeJS.Timeout): void {
  clearInterval(interval);
  console.log('Payment listener stopped');
}
