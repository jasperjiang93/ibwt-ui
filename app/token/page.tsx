import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Token",
  description: "$IBWT — The settlement token powering the IBWT execution network",
  openGraph: {
    title: "Token",
    description: "$IBWT — The settlement token powering the IBWT execution network",
    url: "https://www.inbotwetrust.com/token",
    siteName: "IBWT",
  },
};

const CONTRACT = "Co4KTCKPdAnFhJWNUbPdCn3VFF5xSATaxXpPaGVepump";

export default function TokenPage() {
  return (
    <>
      <Nav />
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gold-gradient mb-4">
            $IBWT Token
          </h1>
          <p className="text-[#888] text-lg mb-12">
            The settlement mechanism for the IBWT execution network.
          </p>

          {/* Role */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-[#e5e5e5] mb-4">Role in the Network</h2>
            <p className="text-[#888] mb-4">
              $IBWT powers settlement within the network. Every task execution, tool invocation, and provider stake flows through the token.
            </p>
            <ul className="space-y-2 text-[#bbb]">
              <li className="flex items-start gap-3">
                <span className="text-[#d4af37]">→</span>
                <span>Settle MCP tool invocations</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#d4af37]">→</span>
                <span>Settle task execution outcomes</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#d4af37]">→</span>
                <span>Provider collateral and staking</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#d4af37]">→</span>
                <span>Network fee settlement</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#d4af37]">→</span>
                <span>Governance voting weight</span>
              </li>
            </ul>
          </section>

          {/* Token Info */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-[#e5e5e5] mb-4">Token Information</h2>
            <div className="card p-6 sm:p-8 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.05)]">
                <span className="text-[#888]">Name</span>
                <span className="text-[#e5e5e5] font-medium">In Bot We Trust</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.05)]">
                <span className="text-[#888]">Symbol</span>
                <a href={`https://pump.fun/coin/${CONTRACT}`} target="_blank" rel="noopener noreferrer" className="text-[#d4af37] font-medium hover:underline">$IBWT</a>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.05)]">
                <span className="text-[#888]">Blockchain</span>
                <span className="text-[#e5e5e5] font-medium">Solana</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.05)]">
                <span className="text-[#888]">Total Supply</span>
                <span className="text-[#e5e5e5] font-medium">1,000,000,000</span>
              </div>
              <div className="py-2">
                <span className="text-[#888] text-sm">Contract Address</span>
                <a href={`https://pump.fun/coin/${CONTRACT}`} target="_blank" rel="noopener noreferrer" className="text-[#d4af37] text-sm mt-1 break-all font-mono block hover:underline">{CONTRACT}</a>
              </div>
            </div>
          </section>

          {/* Disclaimer */}
          <p className="text-[#666] text-xs">
            This is not financial advice. $IBWT is an experimental token. Do not invest more than you can afford to lose.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
