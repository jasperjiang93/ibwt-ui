/**
 * POST /api/mcp/register
 * Register a new MCP server with tools
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ToolDefinition {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  pricingModel?: 'free' | 'per_call' | 'dynamic';
  priceUsd?: number;
  dynamicConfig?: Record<string, unknown>;
}

interface RegisterMcpRequest {
  name: string;
  description?: string;
  endpointUrl?: string;
  documentationUrl?: string;
  defaultPricingModel?: 'free' | 'per_call';
  defaultPriceUsd?: number;
  tools: ToolDefinition[];
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

    // Parse request body
    const body: RegisterMcpRequest = await request.json();
    const {
      name,
      description,
      endpointUrl,
      documentationUrl,
      defaultPricingModel = 'free',
      defaultPriceUsd,
      tools,
    } = body;

    // Validate
    if (!name) {
      return NextResponse.json(
        { error: 'MCP server name is required' },
        { status: 400 }
      );
    }

    if (!tools || tools.length === 0) {
      return NextResponse.json(
        { error: 'At least one tool is required' },
        { status: 400 }
      );
    }

    // Create MCP server with tools
    const mcpServer = await prisma.mcpServer.create({
      data: {
        merchantId: merchant.id,
        name,
        description,
        endpointUrl,
        documentationUrl,
        defaultPricingModel,
        defaultPriceUsd,
        tools: {
          create: tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema as any,
            outputSchema: tool.outputSchema as any,
            pricingModel: tool.pricingModel || defaultPricingModel,
            priceUsd: tool.priceUsd ?? defaultPriceUsd,
            dynamicConfig: tool.dynamicConfig as any,
          })),
        },
      },
      include: {
        tools: true,
      },
    });

    return NextResponse.json({
      id: mcpServer.id,
      name: mcpServer.name,
      description: mcpServer.description,
      endpointUrl: mcpServer.endpointUrl,
      documentationUrl: mcpServer.documentationUrl,
      status: mcpServer.status,
      defaultPricingModel: mcpServer.defaultPricingModel,
      defaultPriceUsd: mcpServer.defaultPriceUsd ? Number(mcpServer.defaultPriceUsd) : null,
      tools: mcpServer.tools.map((tool) => ({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        pricingModel: tool.pricingModel,
        priceUsd: tool.priceUsd ? Number(tool.priceUsd) : null,
      })),
      createdAt: mcpServer.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error registering MCP:', error);
    return NextResponse.json(
      { error: 'Failed to register MCP server' },
      { status: 500 }
    );
  }
}
