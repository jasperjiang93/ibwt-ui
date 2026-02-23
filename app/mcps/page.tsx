"use client";

import { useState } from "react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { WaitlistModal } from "@/components/waitlist-modal";
import { useQuery } from "@tanstack/react-query";
import { gateway, type MCP } from "@/lib/api";
import { useGatewayStore } from "@/lib/gateway-store";

export default function MCPsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { apiKey } = useGatewayStore();

  const { data, isLoading } = useQuery({
    queryKey: ["public-mcps"],
    queryFn: () => gateway.listMCPs(),
    enabled: !!apiKey,
  });

  const mcps: MCP[] = data?.tools || [];

  return (
    <>
      <Nav />

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">MCP Marketplace</h1>
              <p className="text-[#888]">
                Discover MCP servers that AI agents can use to complete tasks
              </p>
            </div>
          </div>

          {/* MCP Grid */}
          {!apiKey ? (
            <div className="card p-12 text-center">
              <h3 className="text-xl font-semibold mb-2">
                Connect your wallet to browse MCPs
              </h3>
              <p className="text-[#888]">
                Sign in to see available MCP servers and their tools
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="h-5 bg-gray-800 rounded w-1/3 mb-3" />
                  <div className="h-4 bg-gray-800 rounded w-2/3 mb-4" />
                  <div className="h-4 bg-gray-800 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : mcps.length === 0 ? (
            <div className="card p-12 text-center">
              <h3 className="text-xl font-semibold mb-2">No MCPs available yet</h3>
              <p className="text-[#888]">
                MCP servers will appear here as they are registered
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mcps.map((mcp) => (
                <div
                  key={mcp.id}
                  className="card p-6 cursor-pointer"
                  onClick={() => setModalOpen(true)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      {mcp.tags?.[0] && (
                        <span className="text-xs text-[#888] bg-[rgba(255,255,255,0.05)] px-2 py-1 rounded mb-2 inline-block">
                          {mcp.tags[0]}
                        </span>
                      )}
                      <h3 className="font-semibold text-lg">{mcp.name}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-[#d4af37]">
                        {mcp.num_tools}
                      </div>
                      <div className="text-xs text-[#888]">tools</div>
                    </div>
                  </div>

                  <p className="text-[#888] text-sm mb-4 line-clamp-2">
                    {mcp.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-[#666] mb-4">
                    <span>{mcp.num_tools} tools</span>
                    <span>{mcp.transport}</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[rgba(212,175,55,0.1)]">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        mcp.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {mcp.status}
                    </span>
                    <span className="text-sm text-[#d4af37] hover:underline">
                      View Details
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 card p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Have an API or Script?</h3>
            <p className="text-[#888]">
              Wrap it as an MCP server and earn credits every time an AI agent uses it.
            </p>
          </div>
        </div>
      </main>

      <Footer />
      <WaitlistModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
