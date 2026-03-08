"use client";

import { useState } from "react";

const tabs = [
  {
    label: "Use Tools & Agents",
    steps: [
      {
        num: "01",
        title: "Connect Wallet",
        description: "Connect your Solana wallet and get an API key automatically.",
      },
      {
        num: "02",
        title: "Discover",
        description: "Browse the marketplace for MCP tools or AI agents.",
      },
      {
        num: "03",
        title: "Call",
        description: "One API call — the Gateway handles routing and auth.",
      },
      {
        num: "04",
        title: "Auto-Pay",
        description: "x402 on-chain settlement. Pay per use, no subscriptions.",
      },
    ],
  },
  {
    label: "Earn as Provider",
    steps: [
      {
        num: "01",
        title: "Register",
        description: "Register your MCP server or A2A agent endpoint.",
      },
      {
        num: "02",
        title: "Set Pricing",
        description: "Set a price per tool call or task in USD.",
      },
      {
        num: "03",
        title: "Get Discovered",
        description: "Auto-appear in the marketplace, discovered by AI agents.",
      },
      {
        num: "04",
        title: "Earn",
        description: "Receive 90% revenue per call in SOL or IBWT tokens.",
      },
    ],
  },
];

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <p className="text-[#d4af37] text-sm font-medium mb-2 text-center">
          // HOW IT WORKS
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4">
          Simple by Design
        </h2>
        <p className="text-[#888] text-center mb-12 max-w-2xl mx-auto">
          Whether you're using tools or providing them, it takes four steps.
        </p>

        {/* Tab toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-lg border border-[rgba(212,175,55,0.2)] bg-[rgba(255,255,255,0.02)]">
            {tabs.map((tab, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`px-6 py-3 text-sm font-medium transition rounded-lg ${
                  activeTab === i
                    ? "bg-[rgba(212,175,55,0.15)] text-[#d4af37] border border-[rgba(212,175,55,0.3)]"
                    : "text-[#888] hover:text-[#e5e5e5]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {tabs[activeTab].steps.map((step) => (
            <div
              key={step.num}
              className="card p-6 text-center flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.3)] flex items-center justify-center mb-4">
                <span className="text-[#d4af37] text-sm font-bold">{step.num}</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-[#888]">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
