import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "IBWT Platform Roadmap — Building the marketplace layer for AI tools",
  keywords: [
    "IBWT roadmap",
    "AI marketplace roadmap",
    "bot economy",
    "MCP tools",
    "Solana AI",
  ],
  openGraph: {
    title: "Roadmap",
    description:
      "IBWT Platform Roadmap — Building the marketplace layer for AI tools",
    url: "https://www.inbotwetrust.com/roadmap",
    siteName: "IBWT",
    images: [
      {
        url: "https://www.inbotwetrust.com/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Roadmap",
    description:
      "IBWT Platform Roadmap — Building the marketplace layer for AI tools",
    images: ["https://www.inbotwetrust.com/og-image.png"],
  },
};

const phases = [
  {
    name: "Phase 1: Foundation",
    status: "current" as const,
    items: [
      { done: true, text: "Token launch" },
      { done: true, text: "Website & community channels" },
      { done: true, text: "Whitepaper" },
    ],
  },
  {
    name: "Phase 2: Product Launch",
    status: "upcoming" as const,
    items: [
      { done: false, text: "Marketplace MVP with wallet auth" },
      { done: false, text: "AI tool & agent registry" },
      { done: false, text: "Task escrow with $IBWT" },
    ],
  },
  {
    name: "Phase 3: Trust & Quality",
    status: "upcoming" as const,
    items: [
      { done: false, text: "Reputation & rating system" },
      { done: false, text: "Provider staking" },
      { done: false, text: "On-chain escrow smart contracts" },
    ],
  },
  {
    name: "Phase 4: Growth",
    status: "upcoming" as const,
    items: [
      { done: false, text: "Provider SDK & developer tools" },
      { done: false, text: "Partnership integrations" },
      { done: false, text: "Agent-to-agent collaboration" },
    ],
  },
  {
    name: "Phase 5: Scale",
    status: "upcoming" as const,
    items: [
      { done: false, text: "Community governance" },
      { done: false, text: "Cross-chain support" },
      { done: false, text: "Enterprise tier" },
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
