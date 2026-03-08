"use client";

import { useState, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { gateway } from "@/lib/api";
import { useGatewayStore } from "@/lib/gateway-store";
import { IBWT_MINT } from "@/lib/network";
import {
  IconTools,
  IconCheck,
  IconWallet,
  IconArrowUp,
  IconAgents,
} from "@/components/icons";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatUsd } from "@/lib/format";

type Period = "1d" | "7d" | "30d";

function periodStart(period: Period): Date {
  const now = new Date();
  if (period === "1d") return new Date(now.getTime() - 86400_000);
  if (period === "7d") return new Date(now.getTime() - 7 * 86400_000);
  return new Date(now.getTime() - 30 * 86400_000);
}

export default function DashboardPage() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { apiKey } = useGatewayStore();
  const [period, setPeriod] = useState<Period>("7d");

  const short = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : "";

  const walletAddress = publicKey?.toBase58() || "";

  // SOL balance
  const { data: solBalance } = useQuery({
    queryKey: ["sol-balance", walletAddress],
    queryFn: async () => {
      if (!publicKey) return 0;
      const lamports = await connection.getBalance(publicKey);
      return lamports / LAMPORTS_PER_SOL;
    },
    enabled: !!publicKey,
    refetchInterval: 30_000,
  });

  // IBWT token balance
  const { data: ibwtBalance } = useQuery({
    queryKey: ["ibwt-balance", walletAddress],
    queryFn: async () => {
      if (!publicKey) return 0;
      try {
        const mint = new PublicKey(IBWT_MINT);
        const { value } = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { mint }
        );
        if (value.length === 0) return 0;
        return value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
      } catch {
        return 0;
      }
    },
    enabled: !!publicKey,
    refetchInterval: 30_000,
  });

  // MCPs
  const { data: mcpData } = useQuery({
    queryKey: ["dashboard-mcps"],
    queryFn: () => gateway.listMCPs(),
    enabled: !!apiKey,
  });

  // Agents
  const { data: agentData } = useQuery({
    queryKey: ["dashboard-agents"],
    queryFn: () => gateway.listAgents(),
    enabled: !!apiKey,
  });

  // Payment history (revenue)
  const { data: paymentData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["dashboard-payments"],
    queryFn: () => gateway.getPaymentHistory(200, 0),
    enabled: !!apiKey,
  });

  // Usage (call logs)
  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ["dashboard-usage"],
    queryFn: () => gateway.getUsage(50, 0),
    enabled: !!apiKey,
  });

  const isLoading = paymentsLoading || usageLoading;
  const payments = paymentData?.payments || [];
  const calls = usageData?.calls || [];

  const allMcps = mcpData?.tools || [];
  const allAgents = agentData?.agents || [];
  const myMcps = allMcps.filter((m) => m.owner_address === walletAddress);
  const myAgents = allAgents.filter((a) => a.owner_address === walletAddress);

  // Total stats
  const totalRevenue = useMemo(
    () =>
      payments
        .filter((p) => p.owner_address === walletAddress)
        .reduce((sum, p) => sum + p.owner_share_usd, 0),
    [payments, walletAddress]
  );
  const totalCalls = usageData?.total || 0;

  // Period stats
  const periodRevenue = useMemo(() => {
    const start = periodStart(period);
    return payments
      .filter(
        (p) =>
          p.owner_address === walletAddress &&
          new Date(p.created_at) >= start
      )
      .reduce((sum, p) => sum + p.owner_share_usd, 0);
  }, [payments, walletAddress, period]);

  const periodCalls = useMemo(() => {
    const start = periodStart(period);
    return calls.filter((c) => new Date(c.created_at) >= start).length;
  }, [calls, period]);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Welcome back{short ? `, ${short}` : ""}
        </h1>
        <p className="text-[#888]">
          Here&apos;s an overview of your IBWT activity
        </p>
      </div>

      {/* Wallet Balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[rgba(148,90,255,0.15)] flex items-center justify-center text-purple-400 text-sm font-bold shrink-0">
            SOL
          </div>
          <div>
            <div className="text-sm text-[#888]">SOL Balance</div>
            <div className="text-2xl font-bold">
              {solBalance !== undefined ? solBalance.toFixed(4) : "—"}
            </div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[rgba(212,175,55,0.15)] flex items-center justify-center text-[#d4af37] text-sm font-bold shrink-0">
            IBWT
          </div>
          <div>
            <div className="text-sm text-[#888]">IBWT Balance</div>
            <div className="text-2xl font-bold">
              {ibwtBalance !== undefined
                ? ibwtBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })
                : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="My MCPs"
          value={String(myMcps.length)}
          sub={`of ${allMcps.length} total`}
          icon={<IconTools size={20} />}
        />
        <StatCard
          label="My Agents"
          value={String(myAgents.length)}
          sub={`of ${allAgents.length} total`}
          icon={<IconAgents size={20} />}
        />
        <StatCard
          label="Total Revenue"
          value={isLoading ? "—" : formatUsd(totalRevenue)}
          icon={<IconWallet size={20} />}
        />
        <StatCard
          label="Total Calls"
          value={isLoading ? "—" : totalCalls.toLocaleString()}
          icon={<IconCheck size={20} />}
        />
      </div>

      {/* Period Stats */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-[#888] mr-1">Period</span>
          {(["1d", "7d", "30d"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                period === p
                  ? "bg-[rgba(212,175,55,0.15)] text-[#d4af37] border border-[rgba(212,175,55,0.3)]"
                  : "text-[#888] hover:text-white"
              }`}
            >
              {p === "1d" ? "24h" : p === "7d" ? "7 days" : "30 days"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-2 text-[#d4af37]">
              <IconArrowUp size={20} />
              <span className="text-sm text-[#888]">Revenue</span>
            </div>
            <div className="text-3xl font-bold">
              {isLoading ? "—" : formatUsd(periodRevenue)}
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-2 text-[#d4af37]">
              <IconCheck size={20} />
              <span className="text-sm text-[#888]">Calls</span>
            </div>
            <div className="text-3xl font-bold">
              {isLoading ? "—" : periodCalls.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Calls */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Calls</h2>
        {usageLoading ? (
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
              <div className="w-40">Service</div>
              <div className="flex-1">Tool</div>
              <div className="w-24 text-right">Revenue</div>
              <div className="w-20 text-right">Duration</div>
              <div className="w-28 text-right">Date</div>
            </div>
            {/* Rows */}
            <div>
              {calls.map((call) => {
                const serviceName =
                  call.gateway_type === "agent"
                    ? allAgents.find((a) => a.id === call.service_id)?.name
                    : allMcps.find((m) => m.id === call.service_id)?.name;
                const matchingPayment = payments.find(
                  (p) =>
                    p.tool_name === call.tool_name &&
                    p.server_id === call.service_id &&
                    p.owner_address === walletAddress &&
                    Math.abs(
                      new Date(p.created_at).getTime() -
                        new Date(call.created_at).getTime()
                    ) < 60_000
                );
                return (
                  <div
                    key={call.id}
                    className="flex items-center gap-3 px-3 py-3 border-b border-gray-800/50 last:border-0"
                  >
                    <StatusBadge status={call.status} />
                    <div className="w-40 min-w-0 flex flex-col gap-0.5">
                      <span className="text-sm truncate">{serviceName || call.service_id.slice(0, 8)}</span>
                      <span className={`text-[10px] uppercase tracking-wider ${
                        call.gateway_type === "agent" ? "text-purple-400" : "text-blue-400"
                      }`}>
                        {call.gateway_type}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 text-sm text-[#aaa] truncate">
                      {call.tool_name}
                    </div>
                    <div className="w-24 text-right text-sm">
                      {matchingPayment ? (
                        <span className="text-green-400">
                          +{formatUsd(matchingPayment.owner_share_usd)}
                        </span>
                      ) : (
                        <span className="text-[#666]">—</span>
                      )}
                    </div>
                    <div className="w-20 text-right text-xs text-[#666]">
                      {call.duration_ms ? `${call.duration_ms}ms` : "—"}
                    </div>
                    <div className="w-28 text-right text-xs text-[#666]">
                      {new Date(call.created_at).toLocaleString(undefined, {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3 text-[#d4af37]">
        {icon}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      {sub && <div className="text-xs text-[#666] mb-0.5">{sub}</div>}
      <div className="text-sm text-[#888]">{label}</div>
    </div>
  );
}
