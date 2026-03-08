"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { gateway, type Agent } from "@/lib/api";
import { useGatewayStore } from "@/lib/gateway-store";
import { StatusBadge } from "@/components/ui/status-badge";

type Filter = "all" | "mine";

export default function AgentsPage() {
  const { apiKey } = useGatewayStore();
  const { publicKey } = useWallet();
  const [filter, setFilter] = useState<Filter>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-agents"],
    queryFn: () => gateway.listAgents(),
    enabled: !!apiKey,
  });

  const allAgents: Agent[] = data?.agents || [];
  const walletAddress = publicKey?.toBase58() || "";
  const agents =
    filter === "mine"
      ? allAgents.filter((a) => a.owner_address === walletAddress)
      : allAgents;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Agents</h1>
          <div className="flex gap-1">
            {(["all", "mine"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filter === f
                    ? "bg-[rgba(212,175,55,0.15)] text-[#d4af37] border border-[rgba(212,175,55,0.3)]"
                    : "text-[#888] hover:text-white"
                }`}
              >
                {f === "all" ? "All" : "Mine"}
              </button>
            ))}
          </div>
        </div>
        <Link
          href="/dashboard/agents/register"
          className="px-4 py-2 bg-[#d4af37] text-black font-medium rounded-lg hover:bg-[#c4a030] transition"
        >
          + Register Agent
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
      ) : agents.length === 0 ? (
        <div className="text-center py-16 border border-gray-800 rounded-xl">
          <p className="text-[#888] mb-2">
            {filter === "mine" ? "You haven't registered any agents" : "No agents found"}
          </p>
          <p className="text-sm text-[#666]">
            Register an A2A agent to start earning per task
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Link
              key={agent.id}
              href={`/dashboard/agents/${agent.id}`}
              className="p-4 border border-gray-800 rounded-xl hover:border-[rgba(212,175,55,0.4)] transition cursor-pointer block"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{agent.name}</h3>
                  {agent.provider_org && (
                    <p className="text-xs text-[#888] mt-0.5">
                      {agent.provider_org}
                    </p>
                  )}
                </div>
                <StatusBadge status={agent.status} />
              </div>
              <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                {agent.description}
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {agent.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-[rgba(255,255,255,0.05)] text-[#888] rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {agent.price_per_task > 0 && (
                <p className="text-xs text-[#888] mb-3">
                  <span className="text-[#d4af37] font-semibold">
                    ${agent.price_per_task.toFixed(4)}
                  </span>{" "}
                  / task
                </p>
              )}
              <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {agent.streaming && (
                    <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                      streaming
                    </span>
                  )}
                </div>
                <div className="text-[#d4af37] font-semibold text-sm">
                  {agent.num_skills} skill{agent.num_skills !== 1 ? "s" : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
