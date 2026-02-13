"use client";

import { useState } from "react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { WaitlistModal } from "@/components/waitlist-modal";
import { ibwtToUsd } from "@/lib/format";

// Mock data
const mockMCPs = [
  {
    id: "1",
    name: "Web Scraper Pro",
    description: "Extract data from any website. Handles JavaScript rendering, pagination, and anti-bot measures.",
    pricePerCall: 10,
    totalCalls: 15420,
    rating: 4.7,
    provider: "ScrapeMaster",
    category: "Data",
  },
  {
    id: "2",
    name: "PDF Parser",
    description: "Extract text, tables, and images from PDF documents. Supports OCR for scanned documents.",
    pricePerCall: 5,
    totalCalls: 28300,
    rating: 4.8,
    provider: "DocTools",
    category: "Document",
  },
  {
    id: "3",
    name: "Image Generator",
    description: "Generate images from text prompts. Multiple styles and aspect ratios supported.",
    pricePerCall: 50,
    totalCalls: 8750,
    rating: 4.5,
    provider: "AIArtLab",
    category: "Creative",
  },
  {
    id: "4",
    name: "Code Analyzer",
    description: "Static code analysis for multiple languages. Finds bugs, security issues, and code smells.",
    pricePerCall: 25,
    totalCalls: 12100,
    rating: 4.9,
    provider: "CodeSafe",
    category: "Development",
  },
  {
    id: "5",
    name: "Translation API",
    description: "Translate text between 100+ languages. Preserves formatting and context.",
    pricePerCall: 3,
    totalCalls: 45000,
    rating: 4.6,
    provider: "LangBridge",
    category: "Language",
  },
  {
    id: "6",
    name: "Sentiment Analyzer",
    description: "Analyze sentiment and emotions in text. Returns confidence scores and detailed breakdown.",
    pricePerCall: 8,
    totalCalls: 19800,
    rating: 4.4,
    provider: "MoodAI",
    category: "Analysis",
  },
];

const categories = ["All", "Data", "Document", "Creative", "Development", "Language", "Analysis"];

export default function MCPsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);

  const filteredMCPs = activeCategory === "All"
    ? mockMCPs
    : mockMCPs.filter((m) => m.category === activeCategory);

  return (
    <>
      <Nav />

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">MCP Tools</h1>
              <p className="text-[#888]">
                Discover tools that AI agents can use to complete tasks
              </p>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  activeCategory === cat
                    ? "bg-[rgba(212,175,55,0.2)] text-[#d4af37] border border-[rgba(212,175,55,0.3)]"
                    : "text-[#888] hover:text-[#e5e5e5] hover:bg-[rgba(255,255,255,0.05)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* MCP Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMCPs.map((mcp) => (
              <div key={mcp.id} className="card p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs text-[#888] bg-[rgba(255,255,255,0.05)] px-2 py-1 rounded mb-2 inline-block">
                      {mcp.category}
                    </span>
                    <h3 className="font-semibold text-lg">{mcp.name}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-[#d4af37]">
                      {mcp.pricePerCall}
                    </div>
                    <div className="text-xs text-[#888]">$IBWT/call</div>
                    <div className="text-xs text-[#999]">
                      ≈ {ibwtToUsd(mcp.pricePerCall)}
                    </div>
                  </div>
                </div>

                <p className="text-[#888] text-sm mb-4 line-clamp-2">
                  {mcp.description}
                </p>

                <div className="flex items-center gap-4 text-sm text-[#666] mb-4">
                  <span>★ {mcp.rating}</span>
                  <span>{mcp.totalCalls.toLocaleString()} calls</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[rgba(212,175,55,0.1)]">
                  <span className="text-sm text-[#888]">
                    by {mcp.provider}
                  </span>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="text-sm text-[#d4af37] hover:underline"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 card p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Have an API or Script?</h3>
            <p className="text-[#888]">
              Wrap it as an MCP tool and earn $IBWT every time an AI agent uses it. Coming soon.
            </p>
          </div>
        </div>
      </main>

      <Footer />
      <WaitlistModal open={modalOpen} onClose={() => setModalOpen(false)} />
</>
  );
}
