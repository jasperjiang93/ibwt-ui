/**
 * POST /api/payment/verify
 * Verify a payment transaction
 */

import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { prisma } from '@/lib/prisma';

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

interface VerifyPaymentRequest {
  paymentId: string;
  txSignature?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyPaymentRequest = await request.json();
    const { paymentId, txSignature } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Missing payment ID' },
        { status: 400 }
      );
    }

    // Get payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        merchant: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Already confirmed
    if (payment.status === 'confirmed') {
      return NextResponse.json({
        verified: true,
        status: 'confirmed',
        txSignature: payment.txSignature,
        confirmedAt: payment.confirmedAt?.toISOString(),
      });
    }

    // Expired
    if (payment.status === 'expired' || payment.expiresAt < new Date()) {
      return NextResponse.json({
        verified: false,
        status: 'expired',
        error: 'Payment has expired',
      });
    }

    // If txSignature provided, verify it
    if (txSignature) {
      const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
      
      try {
        const tx = await connection.getTransaction(txSignature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });

        if (!tx) {
          return NextResponse.json({
            verified: false,
            status: 'pending',
            error: 'Transaction not found or not confirmed',
          });
        }

        // Verify the transaction details
        // Check if it's a transfer to the merchant wallet
        const recipientKey = new PublicKey(payment.recipientWallet);
        
        // For now, we'll do a simple check
        // In production, you'd verify the exact amount and token
        const isValidTx = tx.meta && !tx.meta.err;

        if (isValidTx) {
          // Update payment status
          await prisma.payment.update({
            where: { id: paymentId },
            data: {
              status: 'confirmed',
              txSignature,
              confirmedAt: new Date(),
            },
          });

          // Trigger webhook if configured
          if (payment.merchant.webhookUrl) {
            // Fire and forget webhook
            fetch(payment.merchant.webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-IBWT-Signature': payment.merchant.webhookSecret || '',
              },
              body: JSON.stringify({
                type: 'payment.confirmed',
                payment: {
                  id: payment.id,
                  amountUsd: Number(payment.amountUsd),
                  currency: payment.currency,
                  txSignature,
                  metadata: payment.metadata,
                },
              }),
            }).catch(console.error);
          }

          return NextResponse.json({
            verified: true,
            status: 'confirmed',
            txSignature,
            confirmedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error verifying transaction:', error);
        return NextResponse.json({
          verified: false,
          status: 'pending',
          error: 'Failed to verify transaction',
        });
      }
    }

    // No txSignature provided, return current status
    return NextResponse.json({
      verified: false,
      status: payment.status,
      message: 'Provide txSignature to verify payment',
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
