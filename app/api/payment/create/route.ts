/**
 * POST /api/payment/create
 * Create a new payment request
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPaymentUrl } from '@/lib/solana/pay';
import { usdToSol } from '@/lib/solana/price';

interface CreatePaymentRequest {
  amount: number;
  currency: 'USD' | 'SOL' | 'USDC';
  description?: string;
  metadata?: Record<string, unknown>;
  expiresIn?: number; // seconds, default 3600 (1 hour)
}

export async function POST(request: NextRequest) {
  try {
    // Get API key from header
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 401 }
      );
    }

    // Find merchant by API key
    const merchant = await prisma.merchant.findUnique({
      where: { apiKey },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    if (merchant.status !== 'active') {
      return NextResponse.json(
        { error: 'Merchant account is not active' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: CreatePaymentRequest = await request.json();
    const { amount, currency, description, metadata, expiresIn = 3600 } = body;

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Calculate amounts in different currencies
    let amountUsd = amount;
    let amountSol: number | null = null;
    let amountUsdc: number | null = null;
    let paymentCurrency: 'SOL' | 'USDC' = 'SOL';

    if (currency === 'USD' || currency === 'SOL') {
      // Convert USD to SOL for payment
      if (currency === 'USD') {
        amountSol = await usdToSol(amount);
      } else {
        amountSol = amount;
        // TODO: Convert SOL to USD for record keeping
      }
      paymentCurrency = 'SOL';
    } else if (currency === 'USDC') {
      amountUsdc = amount;
      amountUsd = amount; // USDC is 1:1 with USD
      paymentCurrency = 'USDC';
    }

    // Generate Solana Pay URL
    const paymentAmount = paymentCurrency === 'SOL' ? amountSol! : amountUsdc!;
    const { url: solanaPayUrl, reference } = createPaymentUrl({
      recipient: merchant.walletAddress,
      amount: paymentAmount,
      currency: paymentCurrency,
      label: merchant.name || 'IBWT Payment',
      message: description,
      memo: undefined, // Will add payment ID after creation
    });

    // Calculate expiry
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        merchantId: merchant.id,
        amountUsd,
        amountSol,
        amountUsdc,
        currency: paymentCurrency,
        status: 'pending',
        solanaPayUrl,
        recipientWallet: merchant.walletAddress,
        description,
        metadata: metadata as any,
        expiresAt,
      },
    });

    // Update Solana Pay URL with payment ID in memo
    const finalUrl = createPaymentUrl({
      recipient: merchant.walletAddress,
      amount: paymentAmount,
      currency: paymentCurrency,
      reference: reference,
      label: merchant.name || 'IBWT Payment',
      message: description,
      memo: `ibwt:${payment.id}`,
    });

    // Update payment with final URL
    await prisma.payment.update({
      where: { id: payment.id },
      data: { solanaPayUrl: finalUrl.url },
    });

    return NextResponse.json({
      id: payment.id,
      status: payment.status,
      amountUsd: Number(payment.amountUsd),
      amountSol: payment.amountSol ? Number(payment.amountSol) : null,
      amountUsdc: payment.amountUsdc ? Number(payment.amountUsdc) : null,
      currency: payment.currency,
      solanaPayUrl: finalUrl.url,
      reference: reference,
      expiresAt: payment.expiresAt.toISOString(),
      createdAt: payment.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
