import Link from "next/link";

export default function DocsOverview() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">Documentation</h1>
      <p className="text-[#888] text-lg mb-6">
        IBWT is a unified gateway for MCP tools and AI agents, with on-chain x402 payments.
      </p>

      <div className="p-4 mb-12 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-300">
        IBWT is currently running on <strong>Solana Devnet</strong>. All payments use devnet SOL (free from faucets). Mainnet launch coming soon.
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-16">
        <RoleCard
          href="/docs/mcps"
          title="For AI Agents"
          description="Access 50+ MCP tools through one endpoint. No need to manage multiple connections."
        />
        <RoleCard
          href="/docs/providers"
          title="For Providers"
          description="Register your MCP server or AI agent and earn SOL/IBWT tokens per use."
        />
        <RoleCard
          href="/docs/payments"
          title="Pay Per Use"
          description="No subscriptions. Pay per call with SOL or IBWT tokens via x402."
        />
      </div>

      <h2 className="text-2xl font-bold mb-4">Get Started</h2>
      <p className="text-[#888] mb-4">
        New to IBWT? Start with the{" "}
        <Link href="/docs/quickstart" className="text-[#d4af37] hover:underline">
          Quick Start guide
        </Link>{" "}
        to make your first tool call in 5 minutes.
      </p>
    </>
  );
}

function RoleCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="border border-gray-800 rounded-lg p-5 hover:border-[rgba(212,175,55,0.3)] transition group"
    >
      <h3 className="font-semibold text-[#d4af37] mb-2 group-hover:underline">{title}</h3>
      <p className="text-sm text-[#888]">{description}</p>
    </Link>
  );
}
