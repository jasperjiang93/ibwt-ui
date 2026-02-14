"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WaitlistModal } from "@/components/waitlist-modal";

const isLocal = process.env.NEXT_PUBLIC_ENV === "local";

export function Nav() {
  const pathname = usePathname();
  const { connected } = useWallet();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[rgba(212,175,55,0.2)] bg-[rgba(10,10,15,0.8)] backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-gold-gradient">
          IBWT
        </Link>

        {/* Center Nav — desktop */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink href="/tasks" active={isActive("/tasks")}>
            Tasks
          </NavLink>
          <NavLink href="/agents" active={isActive("/agents")}>
            Agents
          </NavLink>
          <NavLink href="/mcps" active={isActive("/mcps")}>
            MCPs
          </NavLink>

          {/* About Dropdown */}
          <div className="relative">
            <button
              onClick={() => setAboutOpen(!aboutOpen)}
              onBlur={() => setTimeout(() => setAboutOpen(false), 150)}
              className="flex items-center gap-1 text-[#888] hover:text-[#e5e5e5] transition"
            >
              About
              <svg
                className={`w-4 h-4 transition ${aboutOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {aboutOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 py-2 bg-[#12121a] border border-[rgba(212,175,55,0.2)] rounded-lg shadow-xl">
                <DropdownLink href="/whitepaper">Whitepaper</DropdownLink>
                <DropdownLink href="/roadmap">Roadmap</DropdownLink>
                <DropdownLink href="/team">Team</DropdownLink>
                <DropdownLink href="/token">Token</DropdownLink>
              </div>
            )}
          </div>

          <NavLink href="/contact" active={isActive("/contact")}>
            Contact
          </NavLink>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {connected ? (
            <Link href="/dashboard" className="btn-primary text-sm">
              Dashboard
            </Link>
          ) : isLocal ? (
            <Link
              href="/signin"
              className="px-4 py-2 bg-[rgba(212,175,55,0.15)] text-[#d4af37] border border-[rgba(212,175,55,0.3)] rounded-lg text-sm font-medium hover:bg-[rgba(212,175,55,0.25)] transition"
            >
              Sign In
            </Link>
          ) : (
            <button
              onClick={() => setWaitlistOpen(true)}
              className="px-4 py-2 bg-[rgba(212,175,55,0.15)] text-[#d4af37] border border-[rgba(212,175,55,0.3)] rounded-lg text-sm font-medium hover:bg-[rgba(212,175,55,0.25)] transition"
            >
              Sign In
            </button>
          )}

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-[#e5e5e5] transition-all ${mobileOpen ? "translate-y-1 rotate-45" : ""}`} />
            <span className={`block w-5 h-0.5 bg-[#e5e5e5] transition-all ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-[#e5e5e5] transition-all ${mobileOpen ? "-translate-y-1 -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[rgba(212,175,55,0.2)] bg-[rgba(10,10,15,0.95)] backdrop-blur-xl">
          <div className="px-6 py-4 flex flex-col gap-4">
            <MobileNavLink href="/tasks" active={isActive("/tasks")} onNavigate={() => setMobileOpen(false)}>Tasks</MobileNavLink>
            <MobileNavLink href="/agents" active={isActive("/agents")} onNavigate={() => setMobileOpen(false)}>Agents</MobileNavLink>
            <MobileNavLink href="/mcps" active={isActive("/mcps")} onNavigate={() => setMobileOpen(false)}>MCPs</MobileNavLink>
            <MobileNavLink href="/contact" active={isActive("/contact")} onNavigate={() => setMobileOpen(false)}>Contact</MobileNavLink>

            <div className="border-t border-[rgba(212,175,55,0.1)] pt-4 flex flex-col gap-3">
              <p className="text-xs text-[#666] uppercase tracking-wider">About</p>
              <MobileNavLink href="/whitepaper" active={isActive("/whitepaper")} onNavigate={() => setMobileOpen(false)}>Whitepaper</MobileNavLink>
              <MobileNavLink href="/roadmap" active={isActive("/roadmap")} onNavigate={() => setMobileOpen(false)}>Roadmap</MobileNavLink>
              <MobileNavLink href="/team" active={isActive("/team")} onNavigate={() => setMobileOpen(false)}>Team</MobileNavLink>
              <MobileNavLink href="/token" active={isActive("/token")} onNavigate={() => setMobileOpen(false)}>Token</MobileNavLink>
            </div>
          </div>
        </div>
      )}

      <WaitlistModal open={waitlistOpen} onClose={() => setWaitlistOpen(false)} />
    </nav>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`transition font-medium ${
        active ? "text-[#d4af37]" : "text-[#888] hover:text-[#e5e5e5]"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  active,
  onNavigate,
  children,
}: {
  href: string;
  active: boolean;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`transition font-medium text-lg ${
        active ? "text-[#d4af37]" : "text-[#888] hover:text-[#e5e5e5]"
      }`}
    >
      {children}
    </Link>
  );
}

function DropdownLink({
  href,
  external,
  children,
}: {
  href: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  const Component = external ? "a" : Link;
  const props = external ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <Component
      href={href}
      {...props}
      className="block px-4 py-2 text-[#888] hover:text-[#e5e5e5] hover:bg-[rgba(212,175,55,0.1)] transition"
    >
      {children}
    </Component>
  );
}
