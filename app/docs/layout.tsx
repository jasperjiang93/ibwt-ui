"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navSections = [
  {
    items: [
      { href: "/docs", label: "Overview" },
      { href: "/docs/quickstart", label: "Quick Start" },
    ],
  },
  {
    title: "Integrate",
    items: [
      { href: "/docs/claude-code", label: "Claude Code" },
      { href: "/docs/cursor-windsurf", label: "Cursor & Windsurf" },
      { href: "/docs/api-client", label: "API / Custom Client" },
    ],
  },
  {
    title: "Concepts",
    items: [
      { href: "/docs/mcp-gateway", label: "MCP Gateway" },
      { href: "/docs/agents", label: "AI Agents (A2A)" },
      { href: "/docs/credentials", label: "Credentials" },
      { href: "/docs/payments", label: "Payments (x402)" },
    ],
  },
  {
    title: "Build",
    items: [
      { href: "/docs/providers", label: "Provider Guide" },
      { href: "/docs/sdks", label: "SDKs" },
    ],
  },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/docs" ? pathname === "/docs" : pathname === href;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[rgba(212,175,55,0.2)] bg-[#0a0a0f] flex flex-col fixed top-0 left-0 h-screen z-40">
        {/* Logo */}
        <div className="p-6 border-b border-[rgba(212,175,55,0.2)]">
          <Link href="/" className="text-2xl font-bold text-gold-gradient">
            IBWT
          </Link>
          <p className="text-xs text-[#888] mt-1">Documentation</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 overflow-y-auto space-y-6">
          {navSections.map((section, si) => (
            <div key={si}>
              {section.title && (
                <p className="px-4 mb-2 text-xs text-[#666] uppercase tracking-wider font-medium">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-4 py-2 rounded-lg transition text-sm font-medium ${
                      isActive(item.href)
                        ? "bg-[rgba(212,175,55,0.15)] text-[#d4af37] border border-[rgba(212,175,55,0.3)]"
                        : "text-[#888] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#e5e5e5]"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Back to site */}
        <div className="p-4 border-t border-[rgba(212,175,55,0.1)]">
          <Link href="/" className="text-xs text-[#888] hover:text-[#d4af37] transition">
            ← Back to IBWT
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-64">
        <main className="max-w-4xl mx-auto px-8 py-12">{children}</main>
      </div>
    </div>
  );
}
