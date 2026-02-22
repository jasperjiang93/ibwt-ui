"use client";

import { useState, useEffect, use } from "react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import Link from "next/link";

interface McpTool {
  id: string;
  name: string;
  description: string | null;
  inputSchema: Record<string, unknown> | null;
  outputSchema: Record<string, unknown> | null;
  pricingModel: string;
  priceUsd: number | null;
  dynamicConfig: Record<string, unknown> | null;
  totalCalls: number;
  totalRevenue: number;
}

interface McpServer {
  id: string;
  name: string;
  description: string | null;
  endpointUrl: string | null;
  documentationUrl: string | null;
  defaultPricingModel: string;
  defaultPriceUsd: number | null;
  status: string;
  totalCalls: number;
  totalRevenue: number;
  tools: McpTool[];
  provider: {
    name: string | null;
    wallet: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function McpDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [server, setServer] = useState<McpServer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<McpTool | null>(null);

  useEffect(() => {
    fetchMcp();
  }, [id]);

  const fetchMcp = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/mcp/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("MCP server not found");
        throw new Error("Failed to fetch MCP details");
      }
      const data = await res.json();
      setServer(data);
      if (data.tools.length > 0) {
        setSelectedTool(data.tools[0]);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getPricingBadge = (tool: McpTool) => {
    if (tool.pricingModel === "free") {
      return <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm">Free</span>;
    }
    if (tool.pricingModel === "per_call") {
      return (
        <span className="bg-[rgba(212,175,55,0.2)] text-[#d4af37] px-2 py-1 rounded text-sm">
          ${tool.priceUsd?.toFixed(2)}/call
        </span>
      );
    }
    if (tool.pricingModel === "dynamic") {
      return <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-sm">Dynamic</span>;
    }
    return null;
  };

  if (loading) {
    return (
      <>
        <Nav />
        <main className="pt-24 pb-12 px-6">
          <div className="max-w-4xl mx-auto text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-[#888]">Loading MCP details...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !server) {
    return (
      <>
        <Nav />
        <main className="pt-24 pb-12 px-6">
          <div className="max-w-4xl mx-auto text-center py-12">
            <div className="text-4xl mb-4">😕</div>
            <h2 className="text-xl font-semibold mb-2">{error || "MCP not found"}</h2>
            <Link href="/mcps" className="text-[#d4af37] hover:underline">
              ← Back to MCP Marketplace
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <Link href="/mcps" className="text-[#888] hover:text-[#d4af37] mb-6 inline-block">
            ← Back to Marketplace
          </Link>

          {/* Header */}
          <div className="card p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">{server.name}</h1>
                <p className="text-[#888] mb-4">
                  {server.description || "No description provided"}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-[#666]">
                  <span>
                    Provider: {server.provider.name || server.provider.wallet.slice(0, 12) + "..."}
                  </span>
                  <span>•</span>
                  <span>{server.tools.length} tools</span>
                  <span>•</span>
                  <span>{server.totalCalls.toLocaleString()} total calls</span>
                </div>
              </div>
              <div className="flex gap-3">
                {server.documentationUrl && (
                  <a
                    href={server.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-sm"
                  >
                    📄 Docs
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Tools Section */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Tool List */}
            <div className="card p-4">
              <h2 className="font-semibold mb-4">Tools</h2>
              <div className="space-y-2">
                {server.tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool)}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedTool?.id === tool.id
                        ? "bg-[rgba(212,175,55,0.2)] border border-[rgba(212,175,55,0.3)]"
                        : "hover:bg-[rgba(255,255,255,0.05)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{tool.name}</span>
                      {getPricingBadge(tool)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tool Details */}
            <div className="md:col-span-2 card p-6">
              {selectedTool ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">{selectedTool.name}</h2>
                    {getPricingBadge(selectedTool)}
                  </div>

                  <p className="text-[#888] mb-6">
                    {selectedTool.description || "No description provided"}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-[rgba(255,255,255,0.03)] p-4 rounded-lg">
                      <div className="text-2xl font-bold text-[#d4af37]">
                        {selectedTool.totalCalls.toLocaleString()}
                      </div>
                      <div className="text-sm text-[#888]">Total Calls</div>
                    </div>
                    <div className="bg-[rgba(255,255,255,0.03)] p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">
                        ${selectedTool.totalRevenue.toFixed(2)}
                      </div>
                      <div className="text-sm text-[#888]">Total Revenue</div>
                    </div>
                  </div>

                  {/* Input Schema */}
                  {selectedTool.inputSchema && (
                    <div className="mb-6">
                      <h3 className="font-medium mb-2">Input Schema</h3>
                      <pre className="bg-[rgba(0,0,0,0.3)] p-4 rounded-lg overflow-x-auto text-sm text-[#888]">
                        {JSON.stringify(selectedTool.inputSchema, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Output Schema */}
                  {selectedTool.outputSchema && (
                    <div className="mb-6">
                      <h3 className="font-medium mb-2">Output Schema</h3>
                      <pre className="bg-[rgba(0,0,0,0.3)] p-4 rounded-lg overflow-x-auto text-sm text-[#888]">
                        {JSON.stringify(selectedTool.outputSchema, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Usage Example */}
                  <div>
                    <h3 className="font-medium mb-2">Usage Example</h3>
                    <pre className="bg-[rgba(0,0,0,0.3)] p-4 rounded-lg overflow-x-auto text-sm text-[#888]">
{`// Call this tool via IBWT
const result = await ibwt.callTool({
  server: "${server.name}",
  tool: "${selectedTool.name}",
  input: {
    // your input here
  }
});`}
                    </pre>
                  </div>
                </>
              ) : (
                <p className="text-[#888] text-center py-8">
                  Select a tool to view details
                </p>
              )}
            </div>
          </div>

          {/* Integration Guide */}
          <div className="card p-6 mt-6">
            <h2 className="font-semibold mb-4">Integration Guide</h2>
            <div className="space-y-4 text-[#888]">
              <p>
                To use this MCP server in your AI agent, you'll need to:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Register as a merchant and get your API key</li>
                <li>Install the IBWT SDK: <code className="bg-[rgba(0,0,0,0.3)] px-2 py-1 rounded">npm install @ibwt/payment-sdk</code></li>
                <li>Configure your agent to route MCP calls through IBWT</li>
                <li>Handle payment requests when calling paid tools</li>
              </ol>
              <p>
                <Link href="/docs/integration" className="text-[#d4af37] hover:underline">
                  Read the full integration guide →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
