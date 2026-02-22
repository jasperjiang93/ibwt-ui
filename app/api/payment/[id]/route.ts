/**
 * GET /api/payment/[id]
 * Get payment status
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        merchant: {
          select: {
            name: true,
            walletAddress: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check if expired
    if (payment.status === 'pending' && payment.expiresAt < new Date()) {
      await prisma.payment.update({
        where: { id },
        data: { status: 'expired' },
      });
      payment.status = 'expired';
    }

    return NextResponse.json({
      id: payment.id,
      status: payment.status,
      amountUsd: Number(payment.amountUsd),
      amountSol: payment.amountSol ? Number(payment.amountSol) : null,
      amountUsdc: payment.amountUsdc ? Number(payment.amountUsdc) : null,
      currency: payment.currency,
      solanaPayUrl: payment.solanaPayUrl,
      recipientWallet: payment.recipientWallet,
      txSignature: payment.txSignature,
      description: payment.description,
      metadata: payment.metadata,
      expiresAt: payment.expiresAt.toISOString(),
      confirmedAt: payment.confirmedAt?.toISOString() || null,
      createdAt: payment.createdAt.toISOString(),
      merchant: {
        name: payment.merchant.name,
        wallet: payment.merchant.walletAddress,
      },
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment' },
      { status: 500 }
    );
  }
}
