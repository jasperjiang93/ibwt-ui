"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { ibwtToUsd } from "@/lib/format";

interface MCPData {
  id: string;
  name: string;
  description: string | null;
  pricePerCall: number;
  status: string;
  earned: number;
  totalCalls: number;
}

export default function MCPsPage() {
  const { publicKey } = useWallet();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-mcps", publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return { mcps: [] };
      const res = await fetch(`/api/dashboard/mcps?wallet=${publicKey.toBase58()}`);
      if (!res.ok) throw new Error("Failed to fetch tools");
      return res.json() as Promise<{ mcps: MCPData[] }>;
    },
    enabled: !!publicKey,
  });

  const mcps = data?.mcps || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">MCPs</h1>
        <Link
          href="/dashboard/mcps/register"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          + Register MCP
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border border-gray-800 rounded-xl animate-pulse">
              <div className="h-5 bg-gray-800 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-800 rounded w-2/3 mb-4" />
              <div className="h-4 bg-gray-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : mcps.length === 0 ? (
        <div className="text-center py-16 border border-gray-800 rounded-xl">
          <p className="text-[#888] mb-2">No tools registered yet</p>
          <p className="text-sm text-[#666]">Register an MCP tool to start earning $IBWT</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mcps.map((mcp) => (
            <div
              key={mcp.id}
              className="p-4 border border-gray-800 rounded-xl hover:border-purple-600/50 transition cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold">{mcp.name}</h3>
                <div className="text-right">
                  <span className="text-purple-400 text-sm">
                    {mcp.pricePerCall} $IBWT/call
                  </span>
                  <div className="text-[#999] text-xs">
                    ≈ {ibwtToUsd(mcp.pricePerCall)}
                  </div>
                </div>
              </div>
              <p className="text-gray-500 text-sm mb-3">{mcp.description}</p>
              <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                <div className="text-sm text-[#888]">
                  {mcp.totalCalls.toLocaleString()} calls
                </div>
                <div className="text-right">
                  <span className="text-[#d4af37] font-semibold">
                    {mcp.earned.toLocaleString()} $IBWT
                  </span>
                  <div className="text-[#999] text-xs">
                    ≈ {ibwtToUsd(mcp.earned)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
