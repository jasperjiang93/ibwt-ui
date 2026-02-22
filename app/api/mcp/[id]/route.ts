/**
 * GET /api/mcp/[id]
 * Get MCP server details
 * 
 * PUT /api/mcp/[id]
 * Update MCP server (requires API key)
 * 
 * DELETE /api/mcp/[id]
 * Delete MCP server (requires API key)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Public endpoint
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const mcpServer = await prisma.mcpServer.findUnique({
      where: { id },
      include: {
        tools: true,
        merchant: {
          select: {
            name: true,
            walletAddress: true,
          },
        },
      },
    });

    if (!mcpServer) {
      return NextResponse.json(
        { error: 'MCP server not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: mcpServer.id,
      name: mcpServer.name,
      description: mcpServer.description,
      endpointUrl: mcpServer.endpointUrl,
      documentationUrl: mcpServer.documentationUrl,
      defaultPricingModel: mcpServer.defaultPricingModel,
      defaultPriceUsd: mcpServer.defaultPriceUsd ? Number(mcpServer.defaultPriceUsd) : null,
      status: mcpServer.status,
      totalCalls: mcpServer.totalCalls,
      totalRevenue: Number(mcpServer.totalRevenue),
      tools: mcpServer.tools.map((tool) => ({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
        pricingModel: tool.pricingModel,
        priceUsd: tool.priceUsd ? Number(tool.priceUsd) : null,
        dynamicConfig: tool.dynamicConfig,
        totalCalls: tool.totalCalls,
        totalRevenue: Number(tool.totalRevenue),
      })),
      provider: {
        name: mcpServer.merchant.name,
        wallet: mcpServer.merchant.walletAddress,
      },
      createdAt: mcpServer.createdAt.toISOString(),
      updatedAt: mcpServer.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching MCP server:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MCP server' },
      { status: 500 }
    );
  }
}

// PUT - Update MCP server
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Check if MCP server belongs to merchant
    const mcpServer = await prisma.mcpServer.findFirst({
      where: {
        id,
        merchantId: merchant.id,
      },
    });

    if (!mcpServer) {
      return NextResponse.json(
        { error: 'MCP server not found or not owned by you' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      name,
      description,
      endpointUrl,
      documentationUrl,
      defaultPricingModel,
      defaultPriceUsd,
      status,
      tools,
    } = body;

    // Update MCP server
    const updatedServer = await prisma.mcpServer.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(endpointUrl !== undefined && { endpointUrl }),
        ...(documentationUrl !== undefined && { documentationUrl }),
        ...(defaultPricingModel && { defaultPricingModel }),
        ...(defaultPriceUsd !== undefined && { defaultPriceUsd }),
        ...(status && { status }),
      },
      include: {
        tools: true,
      },
    });

    // Update tools if provided
    if (tools && Array.isArray(tools)) {
      for (const tool of tools) {
        if (tool.id) {
          // Update existing tool
          await prisma.mcpTool.update({
            where: { id: tool.id },
            data: {
              ...(tool.name && { name: tool.name }),
              ...(tool.description !== undefined && { description: tool.description }),
              ...(tool.inputSchema !== undefined && { inputSchema: tool.inputSchema }),
              ...(tool.outputSchema !== undefined && { outputSchema: tool.outputSchema }),
              ...(tool.pricingModel && { pricingModel: tool.pricingModel }),
              ...(tool.priceUsd !== undefined && { priceUsd: tool.priceUsd }),
              ...(tool.dynamicConfig !== undefined && { dynamicConfig: tool.dynamicConfig }),
            },
          });
        } else {
          // Create new tool
          await prisma.mcpTool.create({
            data: {
              serverId: id,
              name: tool.name,
              description: tool.description,
              inputSchema: tool.inputSchema,
              outputSchema: tool.outputSchema,
              pricingModel: tool.pricingModel || defaultPricingModel || 'free',
              priceUsd: tool.priceUsd ?? defaultPriceUsd,
              dynamicConfig: tool.dynamicConfig,
            },
          });
        }
      }
    }

    // Fetch updated server with tools
    const finalServer = await prisma.mcpServer.findUnique({
      where: { id },
      include: { tools: true },
    });

    return NextResponse.json({
      id: finalServer!.id,
      name: finalServer!.name,
      description: finalServer!.description,
      status: finalServer!.status,
      tools: finalServer!.tools.map((tool) => ({
        id: tool.id,
        name: tool.name,
        pricingModel: tool.pricingModel,
        priceUsd: tool.priceUsd ? Number(tool.priceUsd) : null,
      })),
      updatedAt: finalServer!.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating MCP server:', error);
    return NextResponse.json(
      { error: 'Failed to update MCP server' },
      { status: 500 }
    );
  }
}

// DELETE - Delete MCP server
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Check if MCP server belongs to merchant
    const mcpServer = await prisma.mcpServer.findFirst({
      where: {
        id,
        merchantId: merchant.id,
      },
    });

    if (!mcpServer) {
      return NextResponse.json(
        { error: 'MCP server not found or not owned by you' },
        { status: 404 }
      );
    }

    // Delete MCP server (cascade deletes tools)
    await prisma.mcpServer.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'MCP server deleted',
    });
  } catch (error) {
    console.error('Error deleting MCP server:', error);
    return NextResponse.json(
      { error: 'Failed to delete MCP server' },
      { status: 500 }
    );
  }
}
