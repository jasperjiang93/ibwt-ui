/**
 * Solana Pay - Generate payment URLs and QR codes
 * Spec: https://docs.solanapay.com/spec
 */

import { PublicKey } from '@solana/web3.js';
import { encodeURL, TransferRequestURL } from '@solana/pay';
import BigNumber from 'bignumber.js';

// USDC on Solana Mainnet
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

// USDC on Devnet (for testing)
const USDC_MINT_DEVNET = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

export interface CreatePaymentUrlParams {
  recipient: string;
  amount: number;
  currency: 'SOL' | 'USDC';
  reference?: string; // Unique payment ID for tracking
  label?: string;
  message?: string;
  memo?: string;
  isDevnet?: boolean;
}

export interface PaymentUrl {
  url: string;
  reference: string;
}

/**
 * Create a Solana Pay transfer URL
 */
export function createPaymentUrl(params: CreatePaymentUrlParams): PaymentUrl {
  const {
    recipient,
    amount,
    currency,
    reference,
    label,
    message,
    memo,
    isDevnet = false,
  } = params;

  // Generate unique reference if not provided
  const paymentReference = reference || generateReference();
  const referenceKey = new PublicKey(paymentReference);

  const urlParams: TransferRequestURL = {
    recipient: new PublicKey(recipient),
    amount: new BigNumber(amount),
    reference: referenceKey,
    label,
    message,
    memo,
  };

  // Add SPL token for USDC
  if (currency === 'USDC') {
    urlParams.splToken = isDevnet ? USDC_MINT_DEVNET : USDC_MINT;
  }

  const url = encodeURL(urlParams);

  return {
    url: url.toString(),
    reference: paymentReference,
  };
}

/**
 * Generate a random reference public key
 */
function generateReference(): string {
  const { Keypair } = require('@solana/web3.js');
  return Keypair.generate().publicKey.toBase58();
}

/**
 * Parse a Solana Pay URL
 */
export function parsePaymentUrl(url: string): TransferRequestURL | null {
  try {
    const { parseURL } = require('@solana/pay');
    return parseURL(url);
  } catch (error) {
    console.error('Error parsing Solana Pay URL:', error);
    return null;
  }
}

/**
 * Create a payment URL with QR code data
 */
export function createPaymentWithQR(params: CreatePaymentUrlParams): {
  url: string;
  reference: string;
  qrData: string;
} {
  const { url, reference } = createPaymentUrl(params);
  
  return {
    url,
    reference,
    qrData: url, // QR code should encode the full URL
  };
}
