/**
 * GET /api/cron/check-payments
 * 
 * Cron endpoint to check pending payments
 * Should be called every 30 seconds by Vercel Cron or similar
 * 
 * Vercel cron config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-payments",
 *     "schedule": "* * * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkPendingPayments } from '@/lib/solana/listener';

// Verify cron secret to prevent unauthorized calls
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const startTime = Date.now();
    const confirmations = await checkPendingPayments();
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      confirmed: confirmations.length,
      payments: confirmations.map((c) => ({
        id: c.paymentId,
        txSignature: c.txSignature,
      })),
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron check-payments error:', error);
    return NextResponse.json(
      { error: 'Failed to check payments' },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}
