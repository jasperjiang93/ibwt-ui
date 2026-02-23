"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { gateway, type MCP } from "@/lib/api";
import { useGatewayStore } from "@/lib/gateway-store";

export default function MCPsPage() {
  const { apiKey } = useGatewayStore();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-mcps"],
    queryFn: () => gateway.listMCPs(),
    enabled: !!apiKey,
  });

  const mcps: MCP[] = data?.tools || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">MCPs</h1>
        <Link
          href="/dashboard/mcps/register"
          className="px-4 py-2 bg-[#d4af37] text-black font-medium rounded-lg hover:bg-[#c4a030] transition"
        >
          + Register MCP
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 border border-gray-800 rounded-xl animate-pulse"
            >
              <div className="h-5 bg-gray-800 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-800 rounded w-2/3 mb-4" />
              <div className="h-4 bg-gray-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : mcps.length === 0 ? (
        <div className="text-center py-16 border border-gray-800 rounded-xl">
          <p className="text-[#888] mb-2">No MCPs registered yet</p>
          <p className="text-sm text-[#666]">
            Register an MCP server to start earning credits
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mcps.map((mcp) => (
            <Link
              key={mcp.id}
              href={`/dashboard/mcps/${mcp.id}`}
              className="p-4 border border-gray-800 rounded-xl hover:border-[rgba(212,175,55,0.4)] transition cursor-pointer block"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold">{mcp.name}</h3>
                <StatusBadge status={mcp.status} />
              </div>
              <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                {mcp.description}
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {mcp.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-[rgba(255,255,255,0.05)] text-[#888] rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                <div className="text-sm text-[#888]">
                  {mcp.transport}
                </div>
                <div className="text-[#d4af37] font-semibold text-sm">
                  {mcp.num_tools} tool{mcp.num_tools !== 1 ? "s" : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    inactive: "bg-gray-500/20 text-gray-400",
    pending: "bg-yellow-500/20 text-yellow-400",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs ${colors[status] || "bg-gray-500/20 text-gray-400"}`}
    >
      {status}
    </span>
  );
}
