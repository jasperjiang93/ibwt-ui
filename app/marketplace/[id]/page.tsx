"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

const API_BASE = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080";

interface MCPServer {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  transport: string;
  tags: string[];
  num_tools: number;
  owner_address: string;
  status: string;
  source: string;
  source_url?: string;
  is_verified: boolean;
  icon_url?: string;
  requires_config: boolean;
  created_at: string;
  updated_at: string;
}

interface MCPTool {
  id: string;
  server_id: string;
  tool_name: string;
  description: string;
  input_schema: Record<string, unknown>;
  price_usd: number;
}

async function fetchMCP(id: string): Promise<MCPServer> {
  const resp = await fetch(`${API_BASE}/api/v1/mcp/${id}`);
  if (!resp.ok) throw new Error("Failed to fetch MCP");
  return resp.json();
}

async function fetchTools(id: string): Promise<{ tools: MCPTool[] }> {
  const resp = await fetch(`${API_BASE}/api/v1/mcp/${id}/tools`);
  if (!resp.ok) throw new Error("Failed to fetch tools");
  return resp.json();
}

export default function MCPDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: mcp, isLoading: mcpLoading } = useQuery({
    queryKey: ["mcp", id],
    queryFn: () => fetchMCP(id),
  });

  const { data: toolsData, isLoading: toolsLoading } = useQuery({
    queryKey: ["mcp-tools", id],
    queryFn: () => fetchTools(id),
    enabled: !!mcp,
  });

  const tools = toolsData?.tools || [];
  const isLoading = mcpLoading || toolsLoading;

  return (
    <>
      <Nav />
      <main className="pt-24 pb-16 px-6 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Back link */}
          <Link
            href="/marketplace"
            className="text-sm text-[#888] hover:text-white mb-6 block"
          >
            ← Back to Marketplace
          </Link>

          {isLoading && (
            <div className="animate-pulse">
              <div className="h-10 bg-gray-800 rounded w-1/3 mb-4" />
              <div className="h-4 bg-gray-800 rounded w-2/3 mb-8" />
              <div className="h-40 bg-gray-800 rounded" />
            </div>
          )}

          {mcp && (
            <>
              {/* Header */}
              <div className="flex items-start gap-4 mb-8">
                {mcp.icon_url ? (
                  <img
                    src={mcp.icon_url}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-[rgba(212,175,55,0.2)] flex items-center justify-center text-2xl text-[#d4af37]">
                    🔧
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{mcp.name}</h1>
                    {mcp.is_verified && (
                      <span className="px-2 py-0.5 bg-[rgba(212,175,55,0.2)] text-[#d4af37] text-sm rounded-full">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <p className="text-[#888]">{mcp.description}</p>
                </div>
              </div>

              {/* Info cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="border border-gray-800 rounded-lg p-4">
                  <div className="text-sm text-[#888] mb-1">Tools</div>
                  <div className="text-2xl font-bold text-[#d4af37]">
                    {mcp.num_tools}
                  </div>
                </div>
                <div className="border border-gray-800 rounded-lg p-4">
                  <div className="text-sm text-[#888] mb-1">Transport</div>
                  <div className="text-lg font-medium">{mcp.transport}</div>
                </div>
                <div className="border border-gray-800 rounded-lg p-4">
                  <div className="text-sm text-[#888] mb-1">Source</div>
                  <div className="text-lg font-medium">
                    {mcp.source === "official-registry" ? "Official" : mcp.source}
                  </div>
                </div>
                <div className="border border-gray-800 rounded-lg p-4">
                  <div className="text-sm text-[#888] mb-1">Status</div>
                  <div
                    className={`text-lg font-medium ${
                      mcp.status === "active" ? "text-green-400" : "text-gray-400"
                    }`}
                  >
                    {mcp.status}
                  </div>
                </div>
              </div>

              {/* Tags */}
              {mcp.tags && mcp.tags.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-3">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {mcp.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-[rgba(255,255,255,0.05)] text-[#888] rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Endpoint */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-3">Endpoint</h2>
                <div className="border border-gray-800 rounded-lg p-4">
                  <code className="text-sm text-[#ccc] break-all">
                    {mcp.endpoint}
                  </code>
                </div>
              </div>

              {/* Tools */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-3">
                  Available Tools ({tools.length})
                </h2>
                {tools.length === 0 ? (
                  <div className="border border-gray-800 rounded-lg p-6 text-center text-[#888]">
                    No tools discovered yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tools.map((tool) => (
                      <div
                        key={tool.id}
                        className="border border-gray-800 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-medium text-[#d4af37]">
                              {tool.tool_name}
                            </h3>
                            <p className="text-sm text-[#888] mt-1">
                              {tool.description || "No description"}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            {tool.price_usd > 0 ? (
                              <span className="text-[#d4af37] font-semibold">
                                ${tool.price_usd}
                              </span>
                            ) : (
                              <span className="text-green-400 text-sm">Free</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Source link */}
              {mcp.source_url && (
                <div className="mb-8">
                  <a
                    href={mcp.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#d4af37] hover:underline"
                  >
                    View Source →
                  </a>
                </div>
              )}

              {/* Integration guide */}
              <div className="border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-3">Quick Integration</h2>
                <p className="text-[#888] text-sm mb-4">
                  Add this MCP to your agent via IBWT Gateway:
                </p>
                <pre className="bg-[rgba(255,255,255,0.03)] border border-gray-800 rounded-lg p-4 overflow-x-auto text-sm">
                  {`curl -X POST ${API_BASE}/api/v1/mcp/${mcp.id}/invoke \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"tool": "TOOL_NAME", "arguments": {}}'`}
                </pre>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
