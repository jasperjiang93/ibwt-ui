"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "@/components/wallet-button";
import { useWallet } from "@solana/wallet-adapter-react";
import { IconOverview, IconTasks, IconAgents, IconTools, IconLock } from "@/components/icons";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: IconOverview },
  { href: "/dashboard/tasks", label: "Tasks", icon: IconTasks },
  { href: "/dashboard/agents", label: "Agents", icon: IconAgents },
  { href: "/dashboard/mcps", label: "MCPs", icon: IconTools },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { connected, publicKey } = useWallet();

  if (!connected || !publicKey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="mb-6 flex justify-center"><IconLock size={48} className="text-[#d4af37]" /></div>
          <h2 className="text-2xl font-bold mb-4">Sign in to continue</h2>
          <p className="text-[#888] mb-8">
            Connect your wallet to access the IBWT dashboard
          </p>
          <Link href="/signin" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[rgba(212,175,55,0.2)] bg-[#0a0a0f] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[rgba(212,175,55,0.2)]">
          <Link href="/" className="text-2xl font-bold text-gold-gradient">
            IBWT
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium ${
                  isActive
                    ? "bg-[rgba(212,175,55,0.15)] text-[#d4af37] border border-[rgba(212,175,55,0.3)]"
                    : "text-[#888] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#e5e5e5]"
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Back to marketplace */}
        <div className="p-4 border-t border-[rgba(212,175,55,0.1)]">
          <Link
            href="/tasks"
            className="flex items-center gap-2 text-sm text-[#888] hover:text-[#e5e5e5] transition"
          >
            ← Back to Marketplace
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 border-b border-[rgba(212,175,55,0.2)] flex items-center justify-between px-6 bg-[rgba(10,10,15,0.8)] backdrop-blur-xl sticky top-0 z-40">
          <div className="text-[#888]">
            {navItems.find((item) =>
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)
            )?.label || "Dashboard"}
          </div>
          <WalletButton />
        </header>

        {/* Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
