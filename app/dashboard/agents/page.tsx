"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ibwtToUsd } from "@/lib/format";

interface AgentData {
  id: string;
  name: string;
  description: string | null;
  walletAddress: string;
  capabilities: string[];
  status: string;
  rating: number;
  completedTasks: number;
  earned: number;
}

export default function AgentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-agents"],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/agents`);
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json() as Promise<{ agents: AgentData[] }>;
    },
  });

  const agents = data?.agents || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Agents</h1>
        <Link
          href="/dashboard/agents/register"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          + Register Agent
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 border border-gray-800 rounded-xl animate-pulse">
              <div className="h-5 bg-gray-800 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-800 rounded w-2/3 mb-4" />
              <div className="h-4 bg-gray-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-16 border border-gray-800 rounded-xl">
          <p className="text-[#888] mb-2">No agents registered yet</p>
          <p className="text-sm text-[#666]">Register an agent to start earning $IBWT</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="p-4 border border-gray-800 rounded-xl"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold">{agent.name}</h3>
                <AgentStatusBadge status={agent.status} />
              </div>
              <p className="text-gray-500 text-sm mb-4">{agent.description}</p>
              <div className="flex gap-4 text-sm mb-3">
                <span className="text-yellow-400">★ {agent.rating}</span>
                <span className="text-gray-500">
                  {agent.completedTasks} tasks completed
                </span>
              </div>
              <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                <span className="text-sm text-[#888]">Earned</span>
                <div className="text-right">
                  <span className="text-[#d4af37] font-semibold">
                    {agent.earned.toLocaleString()} $IBWT
                  </span>
                  <div className="text-[#999] text-xs">
                    ≈ {ibwtToUsd(agent.earned)}
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

function AgentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    available: "bg-green-500/20 text-green-400",
    busy: "bg-yellow-500/20 text-yellow-400",
    disconnected: "bg-gray-500/20 text-gray-400",
  };

  return (
    <span className={`px-2 py-1 rounded text-xs ${styles[status] || styles.disconnected}`}>
      {status}
    </span>
  );
}
