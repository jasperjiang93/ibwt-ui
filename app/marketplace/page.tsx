"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { gateway, type MCP } from "@/lib/api";
import { IconAgents, IconTools } from "@/components/icons";

type Tab = "mcps" | "agents";

export default function MarketplacePage() {
  const [tab, setTab] = useState<Tab>("mcps");
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["marketplace-mcps"],
    queryFn: () => gateway.listMCPs(),
    enabled: tab === "mcps",
  });

  const mcps: MCP[] = data?.tools || [];

  // Get unique tags
  const allTags = Array.from(new Set(mcps.flatMap((m) => m.tags || [])));

  // Filter MCPs
  const filtered = mcps.filter((mcp) => {
    const matchesSearch =
      !search ||
      mcp.name.toLowerCase().includes(search.toLowerCase()) ||
      mcp.description.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !selectedTag || mcp.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <>
      <Nav />
      <main className="pt-24 pb-16 px-6 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gold-gradient">Marketplace</span>
            </h1>
            <p className="text-[#888] text-lg max-w-2xl mx-auto">
              Discover MCP tools and AI agents for the bot economy.
            </p>
          </div>

          {/* Tab Toggle */}
          <div className="flex justify-center gap-2 mb-10">
            <button
              onClick={() => { setTab("mcps"); setSearch(""); setSelectedTag(null); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition ${
                tab === "mcps"
                  ? "bg-[rgba(212,175,55,0.15)] text-[#d4af37] border border-[rgba(212,175,55,0.3)]"
                  : "text-[#888] hover:text-white border border-transparent"
              }`}
            >
              <IconTools size={18} />
              MCP Tools
            </button>
            <button
              onClick={() => setTab("agents")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition ${
                tab === "agents"
                  ? "bg-[rgba(212,175,55,0.15)] text-[#d4af37] border border-[rgba(212,175,55,0.3)]"
                  : "text-[#888] hover:text-white border border-transparent"
              }`}
            >
              <IconAgents size={18} />
              Agents
            </button>
          </div>

          {/* ========== MCP Tab ========== */}
          {tab === "mcps" && (
            <>
              {/* Search & Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <input
                  type="text"
                  placeholder="Search MCPs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 px-4 py-3 bg-[rgba(255,255,255,0.03)] border border-gray-800 rounded-lg focus:border-[rgba(212,175,55,0.5)] focus:outline-none transition"
                />
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      !selectedTag
                        ? "bg-[#d4af37] text-black"
                        : "bg-gray-800 text-[#888] hover:bg-gray-700"
                    }`}
                  >
                    All
                  </button>
                  {allTags.slice(0, 6).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        selectedTag === tag
                          ? "bg-[#d4af37] text-black"
                          : "bg-gray-800 text-[#888] hover:bg-gray-700"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mb-8 text-sm text-[#888]">
                <span>{data?.total || 0} MCPs available</span>
                <span>{filtered.length} shown</span>
              </div>

              {/* Loading */}
              {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="border border-gray-800 rounded-xl p-5 animate-pulse"
                    >
                      <div className="h-6 bg-gray-800 rounded w-2/3 mb-3" />
                      <div className="h-4 bg-gray-800 rounded w-full mb-2" />
                      <div className="h-4 bg-gray-800 rounded w-4/5" />
                    </div>
                  ))}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="text-center py-16">
                  <p className="text-red-400 mb-4">Failed to load MCPs</p>
                  <p className="text-[#666] text-sm">
                    Make sure the gateway is running
                  </p>
                </div>
              )}

              {/* MCP Grid */}
              {!isLoading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((mcp) => (
                    <Link
                      key={mcp.id}
                      href={`/marketplace/${mcp.id}`}
                      className="group border border-gray-800 rounded-xl p-5 hover:border-[rgba(212,175,55,0.4)] transition block"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        {mcp.icon_url ? (
                          <img
                            src={mcp.icon_url}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[rgba(212,175,55,0.2)] flex items-center justify-center text-[#d4af37]">
                            <IconTools size={20} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{mcp.name}</h3>
                            {mcp.is_verified && (
                              <span className="text-[#d4af37] text-sm">✓</span>
                            )}
                          </div>
                          <div className="text-xs text-[#666]">
                            {mcp.source === "official-registry" ? "Official" : mcp.source}
                          </div>
                        </div>
                      </div>

                      <p className="text-[#888] text-sm mb-4 line-clamp-2">
                        {mcp.description || "No description"}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {mcp.tags?.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 bg-[rgba(255,255,255,0.05)] text-[#888] rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-800/50 text-sm">
                        <span className="text-[#666]">{mcp.transport}</span>
                        <span className="text-[#d4af37] font-medium">
                          {mcp.num_tools} tool{mcp.num_tools !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!isLoading && !error && filtered.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-[#888] mb-2">No MCPs found</p>
                  <p className="text-[#666] text-sm">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}

              {/* CTA */}
              <div className="mt-16 text-center">
                <p className="text-[#888] mb-4">Have an MCP to share?</p>
                <Link href="/dashboard/mcps/register" className="btn-primary">
                  Register Your MCP →
                </Link>
              </div>
            </>
          )}

          {/* ========== Agents Tab — Coming Soon ========== */}
          {tab === "agents" && (
            <div className="text-center py-24">
              <h2 className="text-2xl font-bold mb-3">Agent Marketplace</h2>
              <p className="text-[#888] text-lg mb-2">Coming Soon</p>
              <p className="text-[#666] max-w-md mx-auto mb-8">
                Browse and discover autonomous AI agents that can execute tasks using MCP tools.
                The agent marketplace is currently under development.
              </p>
              <Link href="/dashboard/agents/register" className="btn-secondary">
                Register Your Agent →
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
