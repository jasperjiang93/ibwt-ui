/**
 * GET /api/dashboard/mcps
 * Get merchant's MCP servers
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Find merchant by wallet
    const merchant = await prisma.merchant.findUnique({
      where: { walletAddress: wallet },
    });

    if (!merchant) {
      return NextResponse.json({ mcps: [] });
    }

    // Get merchant's MCP servers with stats
    const mcpServers = await prisma.mcpServer.findMany({
      where: { merchantId: merchant.id },
      include: {
        tools: {
          select: {
            id: true,
            name: true,
            pricingModel: true,
            priceUsd: true,
            totalCalls: true,
            totalRevenue: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform for dashboard
    const mcps = mcpServers.map((server) => {
      const totalToolCalls = server.tools.reduce((sum, t) => sum + t.totalCalls, 0);
      const totalToolRevenue = server.tools.reduce((sum, t) => sum + Number(t.totalRevenue), 0);
      
      return {
        id: server.id,
        name: server.name,
        description: server.description,
        status: server.status,
        toolCount: server.tools.length,
        totalCalls: server.totalCalls + totalToolCalls,
        earned: Number(server.totalRevenue) + totalToolRevenue,
        tools: server.tools.map((tool) => ({
          id: tool.id,
          name: tool.name,
          pricingModel: tool.pricingModel,
          priceUsd: tool.priceUsd ? Number(tool.priceUsd) : null,
          totalCalls: tool.totalCalls,
          totalRevenue: Number(tool.totalRevenue),
        })),
        createdAt: server.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ mcps });
  } catch (error) {
    console.error('Error fetching dashboard MCPs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MCPs' },
      { status: 500 }
    );
  }
}
