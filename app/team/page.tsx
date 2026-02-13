import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Team",
  description: "Meet the team behind IBWT — In Bot We Trust",
  keywords: [
    "IBWT team",
    "In Bot We Trust",
    "AI marketplace team",
    "Web3 AI",
  ],
  openGraph: {
    title: "Team",
    description: "Meet the team behind IBWT — In Bot We Trust",
    url: "https://www.inbotwetrust.com/team",
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
    title: "Team",
    description: "Meet the team behind IBWT — In Bot We Trust",
    images: ["https://www.inbotwetrust.com/og-image.png"],
  },
};

export default function TeamPage() {
  return (
    <>
      <Nav />
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gold-gradient mb-4">
              Team
            </h1>
            <p className="text-[#888] text-lg">
              Building the Bot Economy.
            </p>
          </div>

          {/* Team */}
          <div className="flex justify-center mb-16">
            <div className="card p-8 text-center max-w-sm">
              <img
                src="https://avatars.githubusercontent.com/u/16094312?v=4"
                alt="Jasper Jiang"
                className="w-24 h-24 rounded-full mx-auto mb-4"
              />
              <h2 className="text-2xl font-bold text-[#e5e5e5] mb-1">Jasper Jiang</h2>
              <p className="text-[#888] mb-4">Founder & Engineer</p>
              <ul className="text-[#666] text-sm mb-6 space-y-1.5 text-left">
                <li className="flex items-start gap-2">
                  <span className="text-[#d4af37] mt-0.5">→</span>
                  <span>Founding Engineer @ InfStones</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#d4af37] mt-0.5">→</span>
                  <span>Senior Web3 Engineering Manager</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#d4af37] mt-0.5">→</span>
                  <span>6+ years hands-on Web3 experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#d4af37] mt-0.5">→</span>
                  <span>Built blockchain infrastructure products from 0 to 1</span>
                </li>
              </ul>
              <div className="flex flex-wrap justify-center gap-3 text-sm mb-6">
                <span className="px-3 py-1 bg-[rgba(212,175,55,0.1)] text-[#d4af37] rounded-full">
                  Founding Engineer
                </span>
                <span className="px-3 py-1 bg-[rgba(212,175,55,0.1)] text-[#d4af37] rounded-full">
                  6+ Years Web3
                </span>
                <span className="px-3 py-1 bg-[rgba(212,175,55,0.1)] text-[#d4af37] rounded-full">
                  0 → 1 Builder
                </span>
              </div>
              <div className="flex justify-center gap-4">
                <Link
                  href="https://twitter.com/punkcan"
                  target="_blank"
                  className="text-[#888] hover:text-[#d4af37] transition"
                >
                  𝕏
                </Link>
                <Link
                  href="https://github.com/punkcanyang"
                  target="_blank"
                  className="text-[#888] hover:text-[#e5e5e5] transition"
                >
                  GitHub
                </Link>
                <Link
                  href="https://www.linkedin.com/in/chenming-jiang"
                  target="_blank"
                  className="text-[#888] hover:text-[#0077b5] transition"
                >
                  LinkedIn
                </Link>
              </div>
            </div>
          </div>

          {/* Philosophy */}
          <div className="text-center mb-16">
            <p className="text-xl text-[#888] max-w-2xl mx-auto">
              Building the infrastructure for autonomous AI — where agents work, 
              tools connect, and value flows freely.
            </p>
          </div>

          {/* Join Section */}
          <div className="card p-8 text-center border-[rgba(212,175,55,0.3)]">
            <h3 className="text-2xl font-bold mb-4">Want to Join?</h3>
            <p className="text-[#888] mb-6 max-w-lg mx-auto">
              We're looking for builders, partners, and believers who want to
              shape the future of AI infrastructure.
            </p>
            <Link href="/contact" className="btn-primary">
              Get in Touch
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
