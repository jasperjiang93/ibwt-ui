import Link from "next/link";
import { CodeBlock } from "@/components/docs/code-block";
import { DocSection } from "@/components/docs/doc-section";
import { TabGroup } from "@/components/docs/tab-group";

export default function QuickStartPage() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">Quick Start</h1>
      <p className="text-[#888] text-lg mb-12">
        From zero to your first tool call in under 2 minutes.
      </p>

      <DocSection title="1. Connect Your Wallet">
        <p className="text-[#888] mb-4">
          Go to the{" "}
          <Link href="/dashboard" className="text-[#d4af37] hover:underline">
            Dashboard
          </Link>
          , connect your Solana wallet, and an API key is generated
          automatically. Copy it from the{" "}
          <Link
            href="/dashboard/developer"
            className="text-[#d4af37] hover:underline"
          >
            Developer
          </Link>{" "}
          page.
        </p>
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-300">
          IBWT is on <strong>Solana Devnet</strong> during beta. Get free
          devnet SOL from{" "}
          <a
            href="https://faucet.solana.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-yellow-200"
          >
            faucet.solana.com
          </a>
          .
        </div>
      </DocSection>

      <DocSection title="2. Add to Your AI Tool">
        <p className="text-[#888] mb-6">
          Point your AI tool at the IBWT gateway. Replace{" "}
          <code className="text-[#ccc]">YOUR_API_KEY</code> with the key from
          step 1.
        </p>
        <TabGroup
          storageKey="quickstart-tool"
          tabs={[
            {
              label: "Claude Code",
              content: (
                <div>
                  <p className="text-[#888] mb-3">
                    Run this in your terminal:
                  </p>
                  <CodeBlock>{`claude mcp add ibwt-gateway \\
  --transport http \\
  -h "Authorization: Bearer YOUR_API_KEY" \\
  https://gateway.inbotwetrust.com/api/v1/mcp/gateway`}</CodeBlock>
                  <p className="text-[#888] mt-3 text-sm">
                    Then restart Claude Code. See the{" "}
                    <Link
                      href="/docs/claude-code"
                      className="text-[#d4af37] hover:underline"
                    >
                      full Claude Code guide
                    </Link>{" "}
                    for details.
                  </p>
                </div>
              ),
            },
            {
              label: "Cursor",
              content: (
                <div>
                  <p className="text-[#888] mb-3">
                    Add to <code className="text-[#ccc]">.cursor/mcp.json</code>{" "}
                    in your project root:
                  </p>
                  <CodeBlock>{`{
  "mcpServers": {
    "ibwt-gateway": {
      "url": "https://gateway.inbotwetrust.com/api/v1/mcp/gateway",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}`}</CodeBlock>
                  <p className="text-[#888] mt-3 text-sm">
                    Restart Cursor after saving. See the{" "}
                    <Link
                      href="/docs/cursor-windsurf"
                      className="text-[#d4af37] hover:underline"
                    >
                      full Cursor &amp; Windsurf guide
                    </Link>
                    .
                  </p>
                </div>
              ),
            },
            {
              label: "Windsurf",
              content: (
                <div>
                  <p className="text-[#888] mb-3">
                    Add to your Windsurf MCP configuration:
                  </p>
                  <CodeBlock>{`{
  "mcpServers": {
    "ibwt-gateway": {
      "serverUrl": "https://gateway.inbotwetrust.com/api/v1/mcp/gateway",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}`}</CodeBlock>
                </div>
              ),
            },
            {
              label: "curl",
              content: (
                <div>
                  <p className="text-[#888] mb-3">
                    Test the gateway directly:
                  </p>
                  <CodeBlock>{`curl -X POST https://gateway.inbotwetrust.com/api/v1/mcp/gateway \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'`}</CodeBlock>
                </div>
              ),
            },
          ]}
        />
      </DocSection>

      <DocSection title="3. Start Using">
        <p className="text-[#888] mb-4">
          That&apos;s it. Your AI tool now has access to the full IBWT
          marketplace. The AI will automatically:
        </p>
        <ul className="list-disc list-inside text-[#888] space-y-2 mb-6">
          <li>
            <strong className="text-[#ccc]">Discover</strong> available MCP
            servers via built-in gateway tools
          </li>
          <li>
            <strong className="text-[#ccc]">Subscribe</strong> to servers it
            needs for your task
          </li>
          <li>
            <strong className="text-[#ccc]">Call tools</strong> on those
            servers — all through the single gateway endpoint
          </li>
        </ul>
        <p className="text-[#888] mb-4">
          For MCP servers that require API keys (GitHub, Stripe, etc.), store
          your credentials in the{" "}
          <Link
            href="/dashboard/secrets"
            className="text-[#d4af37] hover:underline"
          >
            Secrets
          </Link>{" "}
          page or via the{" "}
          <Link
            href="/docs/credentials"
            className="text-[#d4af37] hover:underline"
          >
            Credentials API
          </Link>
          . The gateway injects them automatically on every call.
        </p>
      </DocSection>
    </>
  );
}
