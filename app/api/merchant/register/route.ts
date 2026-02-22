/**
 * POST /api/merchant/register
 * Register a new merchant and get API keys
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

interface RegisterMerchantRequest {
  walletAddress: string;
  name?: string;
  webhookUrl?: string;
  signature?: string; // For wallet verification (optional for MVP)
}

function generateApiKey(): string {
  return `ibwt_${randomBytes(24).toString('hex')}`;
}

function generateApiSecret(): string {
  return `ibwt_secret_${randomBytes(32).toString('hex')}`;
}

function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString('hex')}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterMerchantRequest = await request.json();
    const { walletAddress, name, webhookUrl } = body;

    // Validate wallet address
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Basic Solana address validation (44 characters, base58)
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid Solana wallet address' },
        { status: 400 }
      );
    }

    // Check if merchant already exists
    const existingMerchant = await prisma.merchant.findUnique({
      where: { walletAddress },
    });

    if (existingMerchant) {
      // Return existing API key (or regenerate if requested)
      return NextResponse.json({
        id: existingMerchant.id,
        walletAddress: existingMerchant.walletAddress,
        name: existingMerchant.name,
        apiKey: existingMerchant.apiKey,
        status: existingMerchant.status,
        message: 'Merchant already registered',
        createdAt: existingMerchant.createdAt.toISOString(),
      });
    }

    // Create new merchant
    const merchant = await prisma.merchant.create({
      data: {
        walletAddress,
        name,
        apiKey: generateApiKey(),
        apiSecret: generateApiSecret(),
        webhookUrl,
        webhookSecret: webhookUrl ? generateWebhookSecret() : null,
      },
    });

    return NextResponse.json({
      id: merchant.id,
      walletAddress: merchant.walletAddress,
      name: merchant.name,
      apiKey: merchant.apiKey,
      apiSecret: merchant.apiSecret,
      webhookSecret: merchant.webhookSecret,
      status: merchant.status,
      createdAt: merchant.createdAt.toISOString(),
      message: 'Merchant registered successfully. Save your API keys securely!',
    });
  } catch (error) {
    console.error('Error registering merchant:', error);
    return NextResponse.json(
      { error: 'Failed to register merchant' },
      { status: 500 }
    );
  }
}
