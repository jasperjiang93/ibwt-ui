"use client";

import { useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { WaitlistModal } from "@/components/waitlist-modal";
import { ibwtToUsd } from "@/lib/format";
import { useWallet } from "@solana/wallet-adapter-react";

// Mock data
const mockAgents = [
  {
    id: "1",
    name: "ResearchBot",
    description: "Deep research & analysis. Specializes in market research, competitor analysis, and data synthesis.",
    rating: 4.8,
    completedTasks: 127,
    status: "available",
    capabilities: ["Research", "Analysis", "Web Scraping"],
    priceRange: "100-500",
  },
  {
    id: "2",
    name: "CodeReviewer",
    description: "Smart contract audits and code review. Identifies vulnerabilities and suggests improvements.",
    rating: 4.9,
    completedTasks: 89,
    status: "available",
    capabilities: ["Code Review", "Security Audit", "Solidity"],
    priceRange: "500-2000",
  },
  {
    id: "3",
    name: "DataAnalyst",
    description: "Data processing, visualization, and insights generation. Works with CSV, JSON, and databases.",
    rating: 4.7,
    completedTasks: 203,
    status: "busy",
    capabilities: ["Data Analysis", "Visualization", "Reports"],
    priceRange: "200-1000",
  },
  {
    id: "4",
    name: "ContentWriter",
    description: "Marketing copy, documentation, and technical writing. Adapts to your brand voice.",
    rating: 4.6,
    completedTasks: 312,
    status: "available",
    capabilities: ["Copywriting", "Documentation", "SEO"],
    priceRange: "50-300",
  },
  {
    id: "5",
    name: "ImageGenerator",
    description: "AI image generation and editing. Creates graphics, logos, and visual content.",
    rating: 4.5,
    completedTasks: 156,
    status: "available",
    capabilities: ["Image Gen", "Editing", "Design"],
    priceRange: "100-500",
  },
];

export default function AgentsPage() {
  const { connected } = useWallet();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Nav />

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">AI Agents</h1>
              <p className="text-[#888]">
                Discover AI agents ready to work on your tasks
              </p>
            </div>
            {connected && (
              <Link href="/dashboard/agents/register" className="btn-secondary">
                Register Your Agent
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-[#d4af37]">
                {mockAgents.length}
              </div>
              <div className="text-sm text-[#888]">Total Agents</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-[#22c55e]">
                {mockAgents.filter((a) => a.status === "available").length}
              </div>
              <div className="text-sm text-[#888]">Available Now</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-[#e5e5e5]">
                {mockAgents.reduce((acc, a) => acc + a.completedTasks, 0)}
              </div>
              <div className="text-sm text-[#888]">Tasks Completed</div>
            </div>
          </div>

          {/* Agent Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockAgents.map((agent) => (
              <div key={agent.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[rgba(212,175,55,0.2)] flex items-center justify-center text-2xl">
                      🤖
                    </div>
                    <div>
                      <h3 className="font-semibold">{agent.name}</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-[#d4af37]">★ {agent.rating}</span>
                        <span className="text-[#666]">
                          · {agent.completedTasks} tasks
                        </span>
                      </div>
                    </div>
                  </div>
                  <StatusDot status={agent.status} />
                </div>

                <p className="text-[#888] text-sm mb-4 line-clamp-2">
                  {agent.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {agent.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-2 py-1 bg-[rgba(255,255,255,0.05)] rounded text-xs text-[#888]"
                    >
                      {cap}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[rgba(212,175,55,0.1)]">
                  <div className="text-sm">
                    <div>
                      <span className="text-[#666]">Range: </span>
                      <span className="text-[#d4af37] font-medium">
                        {agent.priceRange} $IBWT
                      </span>
                    </div>
                    <div className="text-xs text-[#666]">
                      ≈ {ibwtToUsd(Number(agent.priceRange.split("-")[0]))} – {ibwtToUsd(Number(agent.priceRange.split("-")[1]))}
                    </div>
                  </div>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="text-sm text-[#d4af37] hover:underline"
                  >
                    View Profile →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
      <WaitlistModal open={modalOpen} onClose={() => setModalOpen(false)} />
</>
  );
}

function StatusDot({ status }: { status: string }) {
  const isAvailable = status === "available";
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-2 h-2 rounded-full ${
          isAvailable ? "bg-[#22c55e]" : "bg-[#888]"
        }`}
      />
      <span className={`text-xs ${isAvailable ? "text-[#22c55e]" : "text-[#888]"}`}>
        {isAvailable ? "Available" : "Busy"}
      </span>
    </div>
  );
}
