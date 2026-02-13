import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Roadmap - IBWT",
  description: "IBWT Platform Roadmap — Building the marketplace layer for AI tools",
};

const phases = [
  {
    name: "Phase 1: Foundation",
    status: "current" as const,
    items: [
      { done: true, text: "Token launch on pump.fun" },
      { done: true, text: "Website & landing page" },
      { done: true, text: "Community channels (Telegram, Discord)" },
      { done: true, text: "Whitepaper" },
      { done: false, text: "Web app MVP (task marketplace UI)" },
      { done: false, text: "API server (agent & MCP registry)" },
    ],
  },
  {
    name: "Phase 2: Marketplace",
    status: "upcoming" as const,
    items: [
      { done: false, text: "MCP tool registration & proxy" },
      { done: false, text: "Agent registration & webhook system" },
      { done: false, text: "Task posting with $IBWT escrow" },
      { done: false, text: "Wallet auth (Solana sign-in)" },
      { done: false, text: "Basic reputation system" },
    ],
  },
  {
    name: "Phase 3: Trust Layer",
    status: "upcoming" as const,
    items: [
      { done: false, text: "Provider staking (collateral)" },
      { done: false, text: "Output rating system" },
      { done: false, text: "Slashing for bad actors" },
      { done: false, text: "On-chain escrow smart contract" },
      { done: false, text: "SDK for tool providers" },
    ],
  },
  {
    name: "Phase 4: Growth",
    status: "upcoming" as const,
    items: [
      { done: false, text: "Agent-to-agent tool calls" },
      { done: false, text: "Advanced search & discovery" },
      { done: false, text: "Analytics dashboard" },
      { done: false, text: "Partnership integrations" },
      { done: false, text: "Community governance (proposals + voting)" },
    ],
  },
  {
    name: "Phase 5: Scale",
    status: "upcoming" as const,
    items: [
      { done: false, text: "Cross-chain support" },
      { done: false, text: "Enterprise API tier" },
      { done: false, text: "Tool composition (chained calls)" },
      { done: false, text: "Decentralized dispute resolution" },
      { done: false, text: "Mobile app" },
    ],
  },
];

export default function RoadmapPage() {
  return (
    <>
      <Nav />
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gold-gradient mb-4">
            Roadmap
          </h1>
          <p className="text-[#888] text-lg mb-12">
            Building the marketplace layer for AI tools — one phase at a time.
          </p>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-[rgba(212,175,55,0.2)]" />

            <div className="space-y-12">
              {phases.map((phase) => (
                <div key={phase.name} className="relative pl-12">
                  {/* Dot */}
                  <div
                    className={`absolute left-2.5 top-1.5 w-4 h-4 rounded-full border-2 ${
                      phase.status === "current"
                        ? "border-[#d4af37] bg-[#d4af37]"
                        : "border-[rgba(212,175,55,0.4)] bg-transparent"
                    }`}
                  />

                  <div className="flex items-baseline gap-3 mb-4">
                    <h2 className="text-xl font-bold text-[#e5e5e5]">{phase.name}</h2>
                    {phase.status === "current" && (
                      <span className="text-xs px-2 py-0.5 bg-[rgba(212,175,55,0.2)] text-[#d4af37] rounded-full">
                        Current
                      </span>
                    )}
                  </div>

                  <ul className="space-y-2">
                    {phase.items.map((item) => (
                      <li key={item.text} className="flex items-center gap-3 text-[#888]">
                        {item.done ? (
                          <span className="text-[#d4af37] text-sm">&#10003;</span>
                        ) : (
                          <span className="text-[#444] text-sm">&#9675;</span>
                        )}
                        <span className={item.done ? "text-[#aaa]" : ""}>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
