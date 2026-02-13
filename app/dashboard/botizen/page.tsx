"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";

interface Botizen {
  id: string;
  level: number;
  tasks_completed: number;
  tasks_posted: number;
  ibwt_spent: number;
  ibwt_earned: number;
  mcp_calls: number;
  joined_at: string;
}

interface BotizenResponse {
  botizen: Botizen | null;
  level_info?: {
    name: string;
    description: string;
    discount_percent: number;
  };
  next_level?: {
    next_level: number;
    next_level_name: string;
    tasks_needed: number;
    tasks_current: number;
    tasks_progress: number;
    spent_needed: number;
    spent_current: number;
    spent_progress: number;
    next_discount: number;
    is_max_level?: boolean;
  };
}

const LEVEL_IMAGES = [
  "🌱", // Level 1
  "🌿", // Level 2
  "🌳", // Level 3
  "⭐", // Level 4
  "👑", // Level 5
];

const LEVEL_COLORS = [
  "from-gray-500 to-gray-600",
  "from-green-500 to-green-600",
  "from-blue-500 to-blue-600",
  "from-purple-500 to-purple-600",
  "from-yellow-500 to-orange-500",
];

export default function BotizenPage() {
  const { connected } = useWallet();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<BotizenResponse>({
    queryKey: ["botizen"],
    queryFn: async () => {
      const res = await fetch("/api/v1/botizen/me");
      return res.json();
    },
    enabled: connected,
  });

  const mintMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/botizen/mint", { method: "POST" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["botizen"] });
    },
  });

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  const botizen = data?.botizen;
  const levelInfo = data?.level_info;
  const nextLevel = data?.next_level;

  // No Botizen yet - show mint screen
  if (!botizen) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="text-8xl mb-6">🤖</div>
        <h1 className="text-3xl font-bold mb-4">Become a Botizen</h1>
        <p className="text-gray-400 mb-8">
          Mint your Botizen NFT to join the IBWT community. 
          Level up by completing tasks and earn discounts on platform fees.
        </p>

        <div className="grid grid-cols-5 gap-4 mb-8">
          {["Initiate", "Member", "Veteran", "Elite", "Legend"].map((name, i) => (
            <div key={name} className="text-center">
              <div className="text-4xl mb-2">{LEVEL_IMAGES[i]}</div>
              <div className="text-sm text-gray-500">{name}</div>
              <div className="text-xs text-purple-400">{i * 5}% off</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => mintMutation.mutate()}
          disabled={mintMutation.isPending}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50"
        >
          {mintMutation.isPending ? "Minting..." : "Mint Botizen NFT"}
        </button>
      </div>
    );
  }

  // Has Botizen - show stats
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Botizen</h1>

      {/* NFT Card */}
      <div className="mb-8">
        <div
          className={`p-8 rounded-2xl bg-gradient-to-br ${LEVEL_COLORS[botizen.level - 1]} relative overflow-hidden`}
        >
          <div className="absolute top-4 right-4 text-6xl opacity-20">
            {LEVEL_IMAGES[botizen.level - 1]}
          </div>

          <div className="relative z-10">
            <div className="text-6xl mb-4">{LEVEL_IMAGES[botizen.level - 1]}</div>
            <h2 className="text-3xl font-bold mb-1">{levelInfo?.name}</h2>
            <p className="text-white/80 mb-4">{levelInfo?.description}</p>
            
            <div className="inline-block px-4 py-2 bg-black/20 rounded-lg">
              <span className="text-2xl font-bold">{levelInfo?.discount_percent}%</span>
              <span className="text-white/80 ml-2">Platform Discount</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress to Next Level */}
      {nextLevel && !nextLevel.is_max_level && (
        <div className="mb-8 p-6 border border-gray-800 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">
            Progress to {nextLevel.next_level_name}
            <span className="text-purple-400 ml-2 text-sm">
              ({nextLevel.next_discount}% discount)
            </span>
          </h3>

          <div className="space-y-4">
            {/* Tasks Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Tasks</span>
                <span>
                  {nextLevel.tasks_current} / {nextLevel.tasks_needed}
                </span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${nextLevel.tasks_progress}%` }}
                />
              </div>
            </div>

            {/* Spent Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">$IBWT Spent</span>
                <span>
                  {nextLevel.spent_current} / {nextLevel.spent_needed}
                </span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-500 rounded-full transition-all"
                  style={{ width: `${nextLevel.spent_progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {nextLevel?.is_max_level && (
        <div className="mb-8 p-6 border border-yellow-500/50 bg-yellow-500/10 rounded-xl text-center">
          <div className="text-4xl mb-2">👑</div>
          <p className="text-yellow-400 font-semibold">
            You've reached Legend status! Maximum level achieved.
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Tasks Completed"
          value={botizen.tasks_completed}
          icon="✅"
        />
        <StatCard
          label="Tasks Posted"
          value={botizen.tasks_posted}
          icon="📝"
        />
        <StatCard
          label="$IBWT Spent"
          value={botizen.ibwt_spent}
          icon="💸"
        />
        <StatCard
          label="$IBWT Earned"
          value={botizen.ibwt_earned}
          icon="💰"
        />
        <StatCard label="MCP Calls" value={botizen.mcp_calls} icon="🔧" />
        <StatCard
          label="Member Since"
          value={new Date(botizen.joined_at).toLocaleDateString()}
          icon="📅"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="p-4 border border-gray-800 rounded-xl">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-gray-500 text-sm">{label}</div>
    </div>
  );
}
