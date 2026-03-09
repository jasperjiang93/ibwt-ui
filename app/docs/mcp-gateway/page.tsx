import { DocSection } from "@/components/docs/doc-section";
import { CodeBlock } from "@/components/docs/code-block";
import { TryItButton } from "@/components/docs/try-it-button";
import Link from "next/link";

export default function McpGatewayPage() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">MCP Gateway</h1>
      <p className="text-[#888] text-lg mb-12">
        How IBWT aggregates MCP servers behind a single endpoint and lets your
        AI handle everything automatically.
      </p>

      <DocSection title="How It Works">
        <p className="text-[#888] mb-6">
          IBWT Gateway is an MCP reverse proxy. Instead of configuring each MCP
          server individually, you connect once to the gateway. Your AI tool
          talks to the gateway, and the gateway routes requests to the right
          upstream server.
        </p>

        {/* Flow diagram */}
        <div className="border border-gray-800 rounded-xl p-6 mb-6 font-mono text-sm">
          <div className="flex flex-col items-center gap-3 text-[#888]">
            <div className="px-4 py-2 border border-[rgba(212,175,55,0.4)] rounded-lg text-[#d4af37]">
              Your AI Tool (Claude Code / Cursor / Windsurf)
            </div>
            <div className="text-[#666]">↓ JSON-RPC over HTTP</div>
            <div className="px-4 py-2 border-2 border-[#d4af37] rounded-lg text-[#d4af37] font-bold">
              IBWT Gateway
            </div>
            <div className="flex gap-8 mt-2">
              <div className="flex flex-col items-center gap-2">
                <div className="text-[#666]">↓</div>
                <div className="px-3 py-1.5 border border-gray-700 rounded text-[#ccc] text-xs">
                  GitHub
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="text-[#666]">↓</div>
                <div className="px-3 py-1.5 border border-gray-700 rounded text-[#ccc] text-xs">
                  Stripe
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="text-[#666]">↓</div>
                <div className="px-3 py-1.5 border border-gray-700 rounded text-[#ccc] text-xs">
                  Vercel
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="text-[#666]">↓</div>
                <div className="px-3 py-1.5 border border-gray-700 rounded text-[#ccc] text-xs">
                  ...more
                </div>
              </div>
            </div>
          </div>
        </div>
      </DocSection>

      <DocSection title="Automatic Discovery">
        <p className="text-[#888] mb-4">
          When your AI tool connects to the gateway, it receives a set of
          built-in <strong className="text-[#ccc]">meta-tools</strong> for
          discovering and managing MCP servers:
        </p>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-2 px-3 font-medium">Tool</th>
                <th className="text-left py-2 px-3 font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody className="text-[#888]">
              <tr className="border-b border-gray-800/50">
                <td className="py-2 px-3 font-mono text-xs text-[#ccc]">
                  gateway__find_servers
                </td>
                <td className="py-2 px-3">
                  Search for servers by keyword
                </td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="py-2 px-3 font-mono text-xs text-[#ccc]">
                  gateway__list_servers
                </td>
                <td className="py-2 px-3">Browse all available servers</td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="py-2 px-3 font-mono text-xs text-[#ccc]">
                  gateway__subscribe
                </td>
                <td className="py-2 px-3">
                  Activate a server to access its tools
                </td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="py-2 px-3 font-mono text-xs text-[#ccc]">
                  gateway__unsubscribe
                </td>
                <td className="py-2 px-3">Deactivate a server</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono text-xs text-[#ccc]">
                  gateway__list_subscriptions
                </td>
                <td className="py-2 px-3">
                  See your currently active servers
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[#888] mb-4">
          Your AI uses these tools autonomously — you ask for what you need, and
          the AI searches, subscribes, and calls the right tools without any
          manual steps.
        </p>
      </DocSection>

      <DocSection title="Tool Naming">
        <p className="text-[#888] mb-4">
          Tools from subscribed servers are namespaced with the server name to
          avoid collisions:
        </p>
        <CodeBlock>{`ServerName__tool_name

# Examples:
Vercel__list_projects
GitHub__search_repositories
Stripe__create_payment_link`}</CodeBlock>
      </DocSection>

      <DocSection title="Credential Injection">
        <p className="text-[#888] mb-4">
          Many MCP servers require API keys (GitHub tokens, Stripe keys, etc.).
          When you{" "}
          <Link
            href="/docs/credentials"
            className="text-[#d4af37] hover:underline"
          >
            store credentials
          </Link>
          , the gateway automatically injects the right headers on every
          upstream request. Your AI tool never sees the raw credentials.
        </p>
      </DocSection>

      <DocSection title="Browse the Marketplace">
        <p className="text-[#888] mb-4">
          See all available MCP servers right now:
        </p>
        <TryItButton
          label="Try it — List all servers"
          endpoint="/api/v1/mcp/list"
        />
      </DocSection>
    </>
  );
}
