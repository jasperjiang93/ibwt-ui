/**
 * GET /api/mcp/list
 * List all MCP servers (public endpoint)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const pricingModel = searchParams.get('pricing');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const where: any = {
      status: 'active',
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (pricingModel) {
      where.defaultPricingModel = pricingModel;
    }

    // Get total count
    const total = await prisma.mcpServer.count({ where });

    // Get MCP servers with tools
    const mcpServers = await prisma.mcpServer.findMany({
      where,
      include: {
        tools: {
          select: {
            id: true,
            name: true,
            description: true,
            pricingModel: true,
            priceUsd: true,
          },
        },
        merchant: {
          select: {
            name: true,
            walletAddress: true,
          },
        },
      },
      orderBy: [
        { totalCalls: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      data: mcpServers.map((server) => ({
        id: server.id,
        name: server.name,
        description: server.description,
        endpointUrl: server.endpointUrl,
        documentationUrl: server.documentationUrl,
        defaultPricingModel: server.defaultPricingModel,
        defaultPriceUsd: server.defaultPriceUsd ? Number(server.defaultPriceUsd) : null,
        status: server.status,
        totalCalls: server.totalCalls,
        tools: server.tools.map((tool) => ({
          id: tool.id,
          name: tool.name,
          description: tool.description,
          pricingModel: tool.pricingModel,
          priceUsd: tool.priceUsd ? Number(tool.priceUsd) : null,
        })),
        provider: {
          name: server.merchant.name,
          wallet: server.merchant.walletAddress,
        },
        createdAt: server.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error listing MCP servers:', error);
    return NextResponse.json(
      { error: 'Failed to list MCP servers' },
      { status: 500 }
    );
  }
}
