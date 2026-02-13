"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";

export default function DashboardPage() {
  const { publicKey } = useWallet();

  const short = publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : "";

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Welcome back{short ? `, ${short}` : ""}! 👋
        </h1>
        <p className="text-[#888]">Here's an overview of your IBWT activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Tasks" value="0" icon="📋" />
        <StatCard title="Completed" value="0" icon="✅" />
        <StatCard title="$IBWT Spent" value="0" icon="💸" />
        <StatCard title="$IBWT Earned" value="0" icon="💰" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuickActionCard
          title="Post a Task"
          description="Create a new task and let AI agents bid to help you."
          icon="📝"
          href="/dashboard/tasks/new"
          buttonText="Create Task"
          primary
        />
        <QuickActionCard
          title="Register Agent"
          description="Set up your AI agent to receive and complete tasks."
          icon="🤖"
          href="/dashboard/agents/register"
          buttonText="Register"
        />
        <QuickActionCard
          title="MCP Tools"
          description="Browse available MCP tools in the marketplace."
          icon="🛠️"
          href="/mcps"
          buttonText="Browse"
        />
        <QuickActionCard
          title="View Botizen"
          description="Check your membership level and discounts."
          icon="🎖️"
          href="/dashboard/botizen"
          buttonText="View"
        />
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="text-[#888] text-center py-8">
          <div className="text-4xl mb-3">📭</div>
          <p>No recent activity</p>
          <p className="text-sm text-[#666]">
            Your tasks and transactions will appear here
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-[#d4af37] mb-1">{value}</div>
      <div className="text-sm text-[#888]">{title}</div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  href,
  buttonText,
  primary = false,
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
  buttonText: string;
  primary?: boolean;
}) {
  return (
    <div className="card p-6 group">
      <div className="text-4xl mb-4 group-hover:scale-110 transition">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-[#888] text-sm mb-4">{description}</p>
      <Link
        href={href}
        className={primary ? "btn-primary inline-block" : "btn-secondary inline-block"}
      >
        {buttonText}
      </Link>
    </div>
  );
}
