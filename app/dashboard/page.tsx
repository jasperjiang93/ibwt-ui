"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { ibwtToUsd } from "@/lib/format";
import {
  IconClipboard, IconCheck, IconArrowUp, IconArrowDown, IconWallet,
  IconAgents, IconTools,
} from "@/components/icons";

const periods = ["24h", "7d", "30d"] as const;
type Period = (typeof periods)[number];

const periodLabels: Record<Period, string> = {
  "24h": "24 Hours",
  "7d": "7 Days",
  "30d": "30 Days",
};

interface Activity {
  type: "task" | "agent" | "mcp";
  label: string;
  status: string;
  amount: number;
  date: string;
  href: string;
}

interface OverviewData {
  period: string;
  stats: {
    activeTasks: number;
    totalTasksCompleted: number;
    totalAgents: number;
    totalMCPs: number;
    completedTasks: number;
    totalSpent: number;
    totalEarned: number;
  };
  activities: Activity[];
}

export default function DashboardPage() {
  const { publicKey } = useWallet();
  const [period, setPeriod] = useState<Period>("24h");

  const short = publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : "";

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-overview", period, publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return null;
      const res = await fetch(`/api/dashboard/overview?period=${period}&wallet=${publicKey.toBase58()}`);
      if (!res.ok) throw new Error("Failed to fetch overview");
      return res.json() as Promise<OverviewData>;
    },
    enabled: !!publicKey,
  });

  const stats = data?.stats;
  const activities = data?.activities || [];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Welcome back{short ? `, ${short}` : ""}
        </h1>
        <p className="text-[#888]">Here&apos;s an overview of your IBWT activity</p>
      </div>

      {/* Overall Stats (not time-filtered) */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-[#d4af37]">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Tasks"
            value={isLoading ? "—" : String(stats?.activeTasks ?? 0)}
            icon={<IconClipboard size={24} />}
          />
          <StatCard
            title="Total Tasks Completed"
            value={isLoading ? "—" : String(stats?.totalTasksCompleted ?? 0)}
            icon={<IconCheck size={24} />}
          />
          <StatCard
            title="Total Agents"
            value={isLoading ? "—" : String(stats?.totalAgents ?? 0)}
            icon={<IconAgents size={24} />}
          />
          <StatCard
            title="Total MCPs"
            value={isLoading ? "—" : String(stats?.totalMCPs ?? 0)}
            icon={<IconTools size={24} />}
          />
        </div>
      </div>

      {/* Period Stats (time-filtered) */}
      <div>
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#d4af37]">
            Activity ({periodLabels[period]})
          </h2>
          <div className="flex gap-1 bg-[rgba(255,255,255,0.05)] rounded-lg p-1">
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  period === p
                    ? "bg-[#d4af37] text-black"
                    : "text-[#888] hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Completed Tasks"
            value={isLoading ? "—" : String(stats?.completedTasks ?? 0)}
            icon={<IconCheck size={24} />}
          />
          <StatCard
            title="Spent"
            value={isLoading ? "—" : (stats?.totalSpent ?? 0).toLocaleString()}
            sub={stats ? `≈ ${ibwtToUsd(stats.totalSpent)}` : undefined}
            icon={<IconArrowUp size={24} />}
          />
          <StatCard
            title="Earned"
            value={isLoading ? "—" : (stats?.totalEarned ?? 0).toLocaleString()}
            sub={stats ? `≈ ${ibwtToUsd(stats.totalEarned)}` : undefined}
            icon={<IconArrowDown size={24} />}
          />
          {(() => {
            const net = (stats?.totalEarned ?? 0) - (stats?.totalSpent ?? 0);
            return (
              <StatCard
                title="Net"
                value={isLoading ? "—" : `${net >= 0 ? "+" : ""}${net.toLocaleString()}`}
                sub={stats ? `≈ ${ibwtToUsd(Math.abs(net))}` : undefined}
                icon={<IconWallet size={24} />}
                valueColor={net >= 0 ? "text-green-400" : "text-red-400"}
              />
            );
          })()}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-800/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-[#888] text-center py-8">
            <p>No activity in the last {periodLabels[period].toLowerCase()}</p>
            <p className="text-sm text-[#666]">
              Your tasks and transactions will appear here
            </p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-[#666] border-b border-gray-800">
              <div className="w-[72px]">Status</div>
              <div className="w-10">Type</div>
              <div className="flex-1 min-w-0">Details</div>
              <div className="w-24 text-right">Amount</div>
              <div className="w-14 text-right">Date</div>
            </div>
            {/* Rows */}
            <div>
              {activities.map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  className="flex items-center gap-2 px-3 py-3 hover:bg-[rgba(255,255,255,0.03)] transition border-b border-gray-800/50 last:border-0"
                >
                  <StatusBadge status={item.status} />
                  <TypeBadge type={item.type} />
                  <div className="flex-1 min-w-0 text-sm truncate">{item.label}</div>
                  <div className="w-24 text-right shrink-0">
                    <div className={`text-sm font-semibold ${item.amount >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {item.amount >= 0 ? "+" : ""}{item.amount.toLocaleString()} $IBWT
                    </div>
                    <div className="text-xs text-[#999]">≈ {ibwtToUsd(Math.abs(item.amount))}</div>
                  </div>
                  <div className="w-14 text-right text-xs text-[#666] shrink-0">
                    {period === "24h"
                      ? new Date(item.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : new Date(item.date).toLocaleDateString()
                    }
                  </div>
                </Link>
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
  valueColor,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3 text-[#d4af37]">
        {icon}
      </div>
      <div className={`text-3xl font-bold mb-1 ${valueColor || "text-[#d4af37]"}`}>{value}</div>
      {sub && <div className="text-sm text-[#999] mb-1">{sub}</div>}
      <div className="text-sm text-[#888]">{title}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: "bg-green-500/20 text-green-400",
    working: "bg-yellow-500/20 text-yellow-400",
    review: "bg-purple-500/20 text-purple-400",
    done: "bg-gray-500/20 text-gray-400",
    disputed: "bg-red-500/20 text-red-400",
  };

  return (
    <span className={`px-2 py-1 rounded text-xs w-[72px] whitespace-nowrap text-center shrink-0 capitalize ${colors[status] || colors.open}`}>
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    task: "text-[#d4af37]",
    agent: "text-purple-400",
    mcp: "text-blue-400",
  };

  return (
    <span className={`text-xs w-10 shrink-0 ${styles[type] || "text-[#888]"}`}>
      {type}
    </span>
  );
}
