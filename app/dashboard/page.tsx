"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { gateway } from "@/lib/api";
import { useGatewayStore } from "@/lib/gateway-store";
import {
  IconTools,
  IconCheck,
  IconWallet,
  IconArrowUp,
} from "@/components/icons";

export default function DashboardPage() {
  const { publicKey } = useWallet();
  const { apiKey } = useGatewayStore();

  const short = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : "";

  const { data: mcpData, isLoading: mcpsLoading } = useQuery({
    queryKey: ["dashboard-mcps"],
    queryFn: () => gateway.listMCPs(),
    enabled: !!apiKey,
  });

  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ["dashboard-balance"],
    queryFn: () => gateway.getBalance(),
    enabled: !!apiKey,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["dashboard-history"],
    queryFn: () => gateway.getHistory(20, 0),
    enabled: !!apiKey,
  });

  const isLoading = mcpsLoading || balanceLoading || historyLoading;
  const mcps = mcpData?.tools || [];
  const calls = historyData?.calls || [];
  const totalCalls = historyData?.total || 0;
  const credits = balanceData?.credits ?? 0;

  // Calculate revenue from history (sum of credits from successful calls)
  const revenue = calls
    .filter((c) => c.status === "success")
    .reduce((sum, c) => sum + c.credits_charged, 0);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Welcome back{short ? `, ${short}` : ""}
        </h1>
        <p className="text-[#888]">Here&apos;s an overview of your IBWT activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total MCPs"
          value={isLoading ? "—" : String(mcps.length)}
          icon={<IconTools size={24} />}
        />
        <StatCard
          title="Total Calls"
          value={isLoading ? "—" : totalCalls.toLocaleString()}
          icon={<IconCheck size={24} />}
        />
        <StatCard
          title="Credits Balance"
          value={isLoading ? "—" : credits.toLocaleString()}
          icon={<IconWallet size={24} />}
        />
        <StatCard
          title="Revenue"
          value={isLoading ? "—" : revenue.toLocaleString()}
          sub="credits earned"
          icon={<IconArrowUp size={24} />}
        />
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {historyLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 bg-gray-800/50 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : calls.length === 0 ? (
          <div className="text-[#888] text-center py-8">
            <p>No activity yet</p>
            <p className="text-sm text-[#666]">
              API call history will appear here
            </p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 px-3 py-2 text-xs text-[#666] border-b border-gray-800">
              <div className="w-20">Status</div>
              <div className="flex-1">Tool</div>
              <div className="w-24">MCP</div>
              <div className="w-20 text-right">Credits</div>
              <div className="w-20 text-right">Duration</div>
              <div className="w-24 text-right">Date</div>
            </div>
            {/* Rows */}
            <div>
              {calls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center gap-3 px-3 py-3 border-b border-gray-800/50 last:border-0"
                >
                  <StatusBadge status={call.status} />
                  <div className="flex-1 min-w-0 text-sm truncate">
                    {call.tool_name}
                  </div>
                  <div className="w-24 text-sm text-[#888] truncate">
                    {call.service_id.slice(0, 8)}
                  </div>
                  <div className="w-20 text-right text-sm font-semibold text-[#d4af37]">
                    {call.credits_charged}
                  </div>
                  <div className="w-20 text-right text-xs text-[#666]">
                    {call.duration_ms}ms
                  </div>
                  <div className="w-24 text-right text-xs text-[#666]">
                    {new Date(call.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  icon,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3 text-[#d4af37]">
        {icon}
      </div>
      <div className="text-3xl font-bold mb-1 text-[#d4af37]">{value}</div>
      {sub && <div className="text-sm text-[#999] mb-1">{sub}</div>}
      <div className="text-sm text-[#888]">{title}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    success: "bg-green-500/20 text-green-400",
    error: "bg-red-500/20 text-red-400",
    pending: "bg-yellow-500/20 text-yellow-400",
  };

  return (
    <span
      className={`px-2 py-1 rounded text-xs w-20 text-center shrink-0 ${colors[status] || "bg-gray-500/20 text-gray-400"}`}
    >
      {status}
    </span>
  );
}
