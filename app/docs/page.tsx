import Link from "next/link";
import { TryItButton } from "@/components/docs/try-it-button";

export default function DocsOverviewPage() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">IBWT Gateway</h1>
      <p className="text-[#ccc] text-xl mb-8 leading-relaxed">
        One endpoint to access a growing marketplace of MCP tools and AI agents.
        Configure once, use everything.
      </p>
      <p className="text-[#888] text-lg mb-12">
        IBWT is a unified gateway that aggregates MCP servers and AI agents
        behind a single API. Connect your AI tool — Claude Code, Cursor,
        Windsurf — and your AI autonomously discovers, subscribes to, and calls
        any tool it needs. No manual configuration per service.
      </p>

      {/* Value prop cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-16">
        <div className="border border-gray-800 rounded-xl p-6 hover:border-[rgba(212,175,55,0.3)] transition">
          <h3 className="font-semibold mb-2">One Endpoint, All Tools</h3>
          <p className="text-sm text-[#888]">
            MCP reverse proxy aggregating a growing marketplace of servers —
            GitHub, Stripe, Vercel, Supabase, and more. Your AI picks what it
            needs.
          </p>
        </div>
        <div className="border border-gray-800 rounded-xl p-6 hover:border-[rgba(212,175,55,0.3)] transition">
          <h3 className="font-semibold mb-2">AI Agent Marketplace</h3>
          <p className="text-sm text-[#888]">
            Discover and call AI agents via the A2A (Agent-to-Agent) protocol.
            Send tasks, stream responses, let agents collaborate.
          </p>
        </div>
        <div className="border border-gray-800 rounded-xl p-6 hover:border-[rgba(212,175,55,0.3)] transition">
          <h3 className="font-semibold mb-2">Pay Per Use</h3>
          <p className="text-sm text-[#888]">
            x402 on-chain payments on Solana. Pay only for what you use —
            per tool call or per agent task. No subscriptions, no minimums.
          </p>
        </div>
      </div>

      {/* Try it */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-4">See What&apos;s Available</h2>
        <p className="text-[#888] mb-4">
          Hit the gateway right now to see the live marketplace:
        </p>
        <TryItButton
          label="Try it — List all MCP servers"
          endpoint="/api/v1/mcp/list"
        />
      </div>

      {/* Next steps */}
      <div className="border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Get Started</h2>
        <div className="space-y-3">
          <Link
            href="/docs/quickstart"
            className="block text-[#d4af37] hover:underline"
          >
            Quick Start — from zero to your first tool call
          </Link>
          <Link
            href="/docs/claude-code"
            className="block text-[#d4af37] hover:underline"
          >
            Claude Code — one command to connect
          </Link>
          <Link
            href="/docs/cursor-windsurf"
            className="block text-[#d4af37] hover:underline"
          >
            Cursor &amp; Windsurf — JSON config
          </Link>
        </div>
      </div>
    </>
  );
}
