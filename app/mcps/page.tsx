"use client";

import { useState, useEffect } from "react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import Link from "next/link";

interface McpTool {
  id: string;
  name: string;
  description: string | null;
  pricingModel: string;
  priceUsd: number | null;
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
  tools: McpTool[];
  provider: {
    name: string | null;
    wallet: string;
  };
  createdAt: string;
}

interface McpListResponse {
  data: McpServer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const categories = ["All", "Data", "Document", "Creative", "Development", "Finance", "Social"];

export default function MCPsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMcps();
  }, [search]);

  const fetchMcps = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      
      const res = await fetch(`/api/mcp/list?${params}`);
      if (!res.ok) throw new Error("Failed to fetch MCPs");
      
      const data: McpListResponse = await res.json();
      setMcpServers(data.data);
      setError(null);
    } catch (err) {
      setError("Failed to load MCP servers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPricingDisplay = (server: McpServer) => {
    // Find the cheapest non-free tool
    const paidTools = server.tools.filter(t => t.pricingModel !== "free" && t.priceUsd);
    if (paidTools.length === 0) return { label: "Free", price: null };
    
    const cheapest = paidTools.reduce((min, t) => 
      (t.priceUsd && t.priceUsd < (min.priceUsd || Infinity)) ? t : min
    );
    
    return {
      label: `From $${cheapest.priceUsd?.toFixed(2)}`,
      price: cheapest.priceUsd,
    };
  };

  const getToolStats = (server: McpServer) => {
    const free = server.tools.filter(t => t.pricingModel === "free").length;
    const paid = server.tools.filter(t => t.pricingModel !== "free").length;
    return { free, paid, total: server.tools.length };
  };

  return (
    <>
      <Nav />

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">MCP Marketplace</h1>
              <p className="text-[#888]">
                Discover tools that AI agents can use • Pay per call with SOL/USDC
              </p>
            </div>
            <Link
              href="/dashboard/mcps/register"
              className="btn-primary whitespace-nowrap"
            >
              + Register MCP
            </Link>
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search MCP tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-96 px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(212,175,55,0.2)] rounded-lg text-[#e5e5e5] placeholder-[#666] focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  activeCategory === cat
                    ? "bg-[rgba(212,175,55,0.2)] text-[#d4af37] border border-[rgba(212,175,55,0.3)]"
                    : "text-[#888] hover:text-[#e5e5e5] hover:bg-[rgba(255,255,255,0.05)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-[#888]">Loading MCP servers...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button onClick={fetchMcps} className="btn-secondary">
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && mcpServers.length === 0 && (
            <div className="text-center py-12 card">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold mb-2">No MCP Servers Yet</h3>
              <p className="text-[#888] mb-6">
                Be the first to register an MCP server and start earning!
              </p>
              <Link href="/dashboard/mcps/register" className="btn-primary">
                Register Your MCP
              </Link>
            </div>
          )}

          {/* MCP Grid */}
          {!loading && !error && mcpServers.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mcpServers.map((server) => {
                const pricing = getPricingDisplay(server);
                const stats = getToolStats(server);
                
                return (
                  <Link
                    key={server.id}
                    href={`/mcps/${server.id}`}
                    className="card p-6 hover:border-[rgba(212,175,55,0.4)] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{server.name}</h3>
                        <p className="text-sm text-[#888] truncate">
                          by {server.provider.name || server.provider.wallet.slice(0, 8) + "..."}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`text-lg font-bold ${pricing.price ? "text-[#d4af37]" : "text-green-400"}`}>
                          {pricing.label}
                        </div>
                        <div className="text-xs text-[#888]">per call</div>
                      </div>
                    </div>

                    <p className="text-[#888] text-sm mb-4 line-clamp-2">
                      {server.description || "No description provided"}
                    </p>

                    {/* Tools Preview */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {server.tools.slice(0, 3).map((tool) => (
                        <span
                          key={tool.id}
                          className={`text-xs px-2 py-1 rounded ${
                            tool.pricingModel === "free"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-[rgba(212,175,55,0.2)] text-[#d4af37]"
                          }`}
                        >
                          {tool.name}
                        </span>
                      ))}
                      {server.tools.length > 3 && (
                        <span className="text-xs px-2 py-1 text-[#888]">
                          +{server.tools.length - 3} more
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[rgba(212,175,55,0.1)] text-sm text-[#666]">
                      <span>{stats.total} tools ({stats.free} free)</span>
                      <span>{server.totalCalls.toLocaleString()} calls</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 card p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Have an API or Script?</h3>
            <p className="text-[#888] mb-4">
              Wrap it as an MCP tool and earn SOL/USDC every time an AI agent uses it.
            </p>
            <Link href="/dashboard/mcps/register" className="btn-primary">
              Register Your MCP →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
