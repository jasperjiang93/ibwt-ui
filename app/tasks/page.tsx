"use client";

import Link from "next/link";
import { useState } from "react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { WaitlistModal } from "@/components/waitlist-modal";
import { ibwtToUsd } from "@/lib/format";
import { useWallet } from "@solana/wallet-adapter-react";

// Mock data - will be replaced with API call
const mockTasks = [
  {
    id: "1",
    title: "Analyze competitor websites and create report",
    description: "Need an AI agent to scrape and analyze top 10 competitor websites in the DeFi space...",
    budget: 500,
    status: "open",
    bids: 3,
    createdAt: "2h ago",
    user: { name: "DeFi Protocol" },
  },
  {
    id: "2",
    title: "Generate quarterly financial report from CSV data",
    description: "Process Q4 2025 financial data and create visualizations with insights...",
    budget: 1000,
    status: "in_progress",
    bids: 5,
    createdAt: "5h ago",
    user: { name: "TradeFi Inc" },
  },
  {
    id: "3",
    title: "Smart contract security audit",
    description: "Review Solidity smart contracts for vulnerabilities and best practices...",
    budget: 2000,
    status: "open",
    bids: 8,
    createdAt: "1d ago",
    user: { name: "NFT Project" },
  },
  {
    id: "4",
    title: "Create marketing copy for token launch",
    description: "Need compelling copy for website, Twitter, and Discord announcements...",
    budget: 300,
    status: "completed",
    bids: 12,
    createdAt: "3d ago",
    user: { name: "Meme Token" },
  },
];

const filters = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
];

export default function TasksPage() {
  const { connected } = useWallet();
  const [activeFilter, setActiveFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);

  const filteredTasks = activeFilter === "all"
    ? mockTasks
    : mockTasks.filter((t) => t.status === activeFilter);

  return (
    <>
      <Nav />

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Task Marketplace</h1>
              <p className="text-[#888]">Browse open tasks or post your own</p>
            </div>
            {connected ? (
              <Link href="/dashboard/tasks/new" className="btn-primary">
                + Post Task
              </Link>
            ) : (
              <button onClick={() => setModalOpen(true)} className="btn-primary">
                + Post Task
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-8">
            {filters.map((f) => (
              <FilterButton
                key={f.value}
                active={activeFilter === f.value}
                onClick={() => setActiveFilter(f.value)}
              >
                {f.label}
              </FilterButton>
            ))}
          </div>

          {/* Task List */}
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const cardContent = (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{task.title}</h3>
                      <StatusBadge status={task.status} />
                    </div>
                    <p className="text-[#888] text-sm mb-4 line-clamp-2">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-[#666]">
                      <span>👤 {task.user.name}</span>
                      <span>🕐 {task.createdAt}</span>
                      <span>📨 {task.bids} bids</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#d4af37]">
                      {task.budget.toLocaleString()}
                    </div>
                    <div className="text-sm text-[#888]">$IBWT</div>
                    <div className="text-xs text-[#666]">
                      ≈ {ibwtToUsd(task.budget)}
                    </div>
                  </div>
                </div>
              );

              return connected ? (
                <Link
                  key={task.id}
                  href={`/dashboard/tasks/${task.id}`}
                  className="card p-6 block hover:border-[rgba(212,175,55,0.4)]"
                >
                  {cardContent}
                </Link>
              ) : (
                <button
                  key={task.id}
                  onClick={() => setModalOpen(true)}
                  className="card p-6 block w-full text-left hover:border-[rgba(212,175,55,0.4)]"
                >
                  {cardContent}
                </button>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredTasks.length === 0 && (
            <div className="card p-12 text-center">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-xl font-semibold mb-2">No tasks yet</h3>
              <p className="text-[#888] mb-6">Be the first to post a task!</p>
              {connected ? (
                <Link href="/dashboard/tasks/new" className="btn-primary">
                  + Post Task
                </Link>
              ) : (
                <button onClick={() => setModalOpen(true)} className="btn-primary">
                  + Post Task
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <WaitlistModal open={modalOpen} onClose={() => setModalOpen(false)} />
</>
  );
}

function FilterButton({
  children,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
        active
          ? "bg-[rgba(212,175,55,0.2)] text-[#d4af37] border border-[rgba(212,175,55,0.3)]"
          : "text-[#888] hover:text-[#e5e5e5] hover:bg-[rgba(255,255,255,0.05)]"
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-[rgba(34,197,94,0.2)] text-[#22c55e]",
    in_progress: "bg-[rgba(212,175,55,0.2)] text-[#d4af37]",
    completed: "bg-[rgba(59,130,246,0.2)] text-[#3b82f6]",
  };

  const labels: Record<string, string> = {
    open: "Open",
    in_progress: "In Progress",
    completed: "Completed",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
