import { CodeBlock } from "@/components/docs/code-block";
import { DocSection } from "@/components/docs/doc-section";
import Link from "next/link";

export default function ClaudeCodePage() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">Claude Code</h1>
      <p className="text-[#888] text-lg mb-12">
        Connect IBWT Gateway to Claude Code and access the full MCP marketplace
        from your terminal.
      </p>

      <DocSection title="1. Add the Gateway">
        <p className="text-[#888] mb-4">
          Run this command in your terminal. Replace{" "}
          <code className="text-[#ccc]">YOUR_API_KEY</code> with your key from
          the{" "}
          <Link
            href="/dashboard/developer"
            className="text-[#d4af37] hover:underline"
          >
            Developer dashboard
          </Link>
          .
        </p>
        <CodeBlock title="Terminal">{`claude mcp add ibwt-gateway \\
  --transport http \\
  -h "Authorization: Bearer YOUR_API_KEY" \\
  https://gateway.inbotwetrust.com/api/v1/mcp/gateway`}</CodeBlock>
      </DocSection>

      <DocSection title="2. Restart Claude Code">
        <p className="text-[#888] mb-4">
          Start a new Claude Code session. On startup, Claude discovers the
          gateway&apos;s built-in tools:
        </p>
        <ul className="list-disc list-inside text-[#888] space-y-2">
          <li>
            <code className="text-[#ccc]">gateway__find_servers</code> — search
            for MCP servers by keyword
          </li>
          <li>
            <code className="text-[#ccc]">gateway__list_servers</code> — browse
            all available servers
          </li>
          <li>
            <code className="text-[#ccc]">gateway__subscribe</code> — activate
            a server to use its tools
          </li>
          <li>
            <code className="text-[#ccc]">gateway__unsubscribe</code> —
            deactivate a server
          </li>
          <li>
            <code className="text-[#ccc]">gateway__list_subscriptions</code> —
            see your active servers
          </li>
        </ul>
      </DocSection>

      <DocSection title="3. Just Ask">
        <p className="text-[#888] mb-4">
          You don&apos;t need to manually subscribe to anything. Just ask Claude
          what you need — it handles discovery and subscription automatically.
        </p>
        <div className="border border-gray-800 rounded-xl overflow-hidden mb-6">
          <div className="px-4 py-2 bg-[rgba(255,255,255,0.03)] border-b border-gray-800 text-xs text-[#888]">
            Example conversation
          </div>
          <div className="p-4 space-y-4 text-sm">
            <div>
              <p className="text-[#d4af37] font-medium mb-1">You:</p>
              <p className="text-[#ccc]">
                Search for MCP servers related to &quot;database&quot;
              </p>
            </div>
            <div>
              <p className="text-blue-400 font-medium mb-1">Claude:</p>
              <p className="text-[#888]">
                I&apos;ll search the IBWT marketplace for database-related
                servers.
              </p>
              <div className="mt-2 px-3 py-2 bg-[rgba(255,255,255,0.02)] rounded text-xs font-mono text-[#666]">
                → gateway__find_servers({`{"query": "database"}`})
                <br />
                Found: Supabase, Neon, Prisma Postgres
              </div>
            </div>
            <div>
              <p className="text-[#d4af37] font-medium mb-1">You:</p>
              <p className="text-[#ccc]">
                Subscribe to Neon and list my databases
              </p>
            </div>
            <div>
              <p className="text-blue-400 font-medium mb-1">Claude:</p>
              <p className="text-[#888]">
                I&apos;ll subscribe to Neon and then list your databases.
              </p>
              <div className="mt-2 px-3 py-2 bg-[rgba(255,255,255,0.02)] rounded text-xs font-mono text-[#666]">
                → gateway__subscribe({`{"server_id": "..."}`})
                <br />→ Neon__list_projects()
              </div>
            </div>
          </div>
        </div>
      </DocSection>

      <DocSection title="4. Auth-Required Services">
        <p className="text-[#888] mb-4">
          Some MCP servers need API keys (e.g., GitHub, Stripe, Neon). Store
          your credentials once and the gateway injects them automatically on
          every call.
        </p>
        <p className="text-[#888] mb-4">
          Two ways to store credentials:
        </p>
        <ul className="list-disc list-inside text-[#888] space-y-2 mb-4">
          <li>
            <Link
              href="/dashboard/secrets"
              className="text-[#d4af37] hover:underline"
            >
              Dashboard → Secrets
            </Link>{" "}
            — UI for managing credentials
          </li>
          <li>
            <Link
              href="/docs/credentials"
              className="text-[#d4af37] hover:underline"
            >
              Credentials API
            </Link>{" "}
            — programmatic access
          </li>
        </ul>
      </DocSection>

      <DocSection title="Remove the Gateway">
        <p className="text-[#888] mb-4">To disconnect:</p>
        <CodeBlock>{`claude mcp remove ibwt-gateway`}</CodeBlock>
      </DocSection>
    </>
  );
}
