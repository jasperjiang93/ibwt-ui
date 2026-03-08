"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { gateway } from "@/lib/api";
import { useGatewayStore } from "@/lib/gateway-store";
import { formatUsd } from "@/lib/format";

type Tab = "payments" | "usage";

export default function PaymentsPage() {
  const { apiKey } = useGatewayStore();
  const [tab, setTab] = useState<Tab>("payments");

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["payments-history"],
    queryFn: () => gateway.getPaymentHistory(),
    enabled: !!apiKey,
  });

  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ["usage-history"],
    queryFn: () => gateway.getUsage(),
    enabled: !!apiKey,
  });

  const payments = paymentsData?.payments ?? [];
  const calls = usageData?.calls ?? [];

  const totalSpent = payments.reduce((sum, p) => sum + p.amount_usd, 0);
  const totalEarned = payments.reduce((sum, p) => sum + p.owner_share_usd, 0);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">Payments</h1>
      <p className="text-[#888] mb-6">
        x402 on-chain payment history and API usage
      </p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <div className="text-sm text-[#888] mb-1">Total Spent</div>
          <div className="text-2xl font-bold text-[#d4af37]">
            {formatUsd(totalSpent)}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-[#888] mb-1">Total Earned</div>
          <div className="text-2xl font-bold text-green-400">
            {formatUsd(totalEarned)}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-[#888] mb-1">Total Calls</div>
          <div className="text-2xl font-bold">{calls.length}</div>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("payments")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === "payments"
              ? "bg-[rgba(212,175,55,0.15)] text-[#d4af37] border border-[rgba(212,175,55,0.3)]"
              : "text-[#888] hover:text-white"
          }`}
        >
          Payment History
        </button>
        <button
          onClick={() => setTab("usage")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === "usage"
              ? "bg-[rgba(212,175,55,0.15)] text-[#d4af37] border border-[rgba(212,175,55,0.3)]"
              : "text-[#888] hover:text-white"
          }`}
        >
          API Usage
        </button>
      </div>

      {/* Payments Tab */}
      {tab === "payments" && (
        <div className="card overflow-hidden">
          {paymentsLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-800/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-[#888]">
              No payments yet. Payments are recorded when you call paid tools.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800 text-[#888]">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Tool</th>
                  <th className="px-4 py-3 text-left">Token</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-800/50">
                    <td className="px-4 py-3 text-[#888]">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 truncate max-w-[200px]">{p.tool_name}</td>
                    <td className="px-4 py-3 text-[#888]">{p.token}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#d4af37]">
                      {formatUsd(p.amount_usd)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs rounded bg-green-500/20 text-green-400">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Usage Tab */}
      {tab === "usage" && (
        <div className="card overflow-hidden">
          {usageLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-800/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : calls.length === 0 ? (
            <div className="p-8 text-center text-[#888]">
              No API calls yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800 text-[#888]">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Tool</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-right">Duration</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((c) => (
                  <tr key={c.id} className="border-b border-gray-800/50">
                    <td className="px-4 py-3 text-[#888]">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 truncate max-w-[200px]">{c.tool_name}</td>
                    <td className="px-4 py-3 text-[#888]">{c.gateway_type}</td>
                    <td className="px-4 py-3 text-right text-[#888]">
                      {c.duration_ms ? `${c.duration_ms}ms` : "\u2014"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${
                          c.status === "success"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
