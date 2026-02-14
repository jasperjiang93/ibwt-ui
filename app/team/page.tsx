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
    "AI infrastructure team",
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
            <div className="card p-10 text-center max-w-lg w-full">
              <img
                src="https://avatars.githubusercontent.com/u/16094312?v=4"
                alt="Jasper Jiang"
                className="w-28 h-28 rounded-full mx-auto mb-5"
              />
              <h2 className="text-3xl font-bold text-[#e5e5e5] mb-1">Jasper Jiang</h2>
              <p className="text-[#888] text-lg mb-2">Founder & Engineer</p>
              <p className="text-[#d4af37] italic mb-6">
                Building infrastructure for autonomous AI systems to execute real work.
              </p>
              <ul className="text-[#bbb] mb-8 space-y-2.5 text-left">
                <li className="flex items-start gap-3">
                  <span className="text-[#d4af37] mt-0.5">→</span>
                  <span>Founding Engineer @ InfStones</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#d4af37] mt-0.5">→</span>
                  <span>Senior Web3 Engineering Manager</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#d4af37] mt-0.5">→</span>
                  <span>6+ years building blockchain infrastructure from 0 to 1</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#d4af37] mt-0.5">→</span>
                  <span>Focused on automation, distributed systems, and AI-driven execution</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#d4af37] mt-0.5">→</span>
                  <span>Active in Web3 infrastructure and developer ecosystems</span>
                </li>
              </ul>
              <div className="flex justify-center gap-3">
                <Link
                  href="https://twitter.com/punkcan"
                  target="_blank"
                  className="px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#ccc] hover:text-[#d4af37] hover:border-[rgba(212,175,55,0.3)] transition text-sm font-medium"
                >
                  𝕏 Twitter
                </Link>
                <Link
                  href="https://github.com/jasperjiagn93"
                  target="_blank"
                  className="px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#ccc] hover:text-[#e5e5e5] hover:border-[rgba(255,255,255,0.2)] transition text-sm font-medium"
                >
                  GitHub
                </Link>
                <Link
                  href="https://www.linkedin.com/in/chenming-jiang"
                  target="_blank"
                  className="px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#ccc] hover:text-[#0077b5] hover:border-[rgba(0,119,181,0.3)] transition text-sm font-medium"
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
