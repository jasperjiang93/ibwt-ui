import Link from "next/link";
import { CodeBlock } from "@/components/docs/code-block";
import { DocSection } from "@/components/docs/doc-section";

export default function QuickStartPage() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">Quick Start</h1>
      <p className="text-[#888] text-lg mb-6">
        From zero to your first tool call in 5 minutes.
      </p>

      <div className="p-4 mb-12 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-300">
        IBWT is on <strong>Solana Devnet</strong>. You&apos;ll need devnet SOL — get free tokens from{" "}
        <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-200">
          faucet.solana.com
        </a>.
      </div>

      <DocSection title="1. Connect Wallet & Get API Key">
        <p className="text-[#888] mb-4">
          Go to the{" "}
          <Link href="/dashboard" className="text-[#d4af37] hover:underline">
            Dashboard
          </Link>
          , connect your Solana wallet, and an API key is generated automatically.
        </p>
      </DocSection>

      <DocSection title="2. Browse Available MCPs">
        <p className="text-[#888] mb-4">
          ~50 popular MCP servers come pre-configured. Browse the marketplace:
        </p>
        <CodeBlock>{`curl https://gateway.inbotwetrust.com/api/v1/mcp/list`}</CodeBlock>
      </DocSection>

      <DocSection title="3. Store Credentials (if needed)">
        <p className="text-[#888] mb-4">
          Some MCPs require API keys (e.g., GitHub, Exa). Store your credentials — this also auto-discovers the MCP&apos;s tools:
        </p>
        <CodeBlock>{`curl -X POST https://gateway.inbotwetrust.com/api/v1/credentials \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "mcp_id": "github-mcp-id",
    "tokens": { "GITHUB_TOKEN": "ghp_..." }
  }'`}</CodeBlock>
      </DocSection>

      <DocSection title="4. Call a Tool">
        <p className="text-[#888] mb-4">
          Invoke any tool via the <code className="text-[#ccc]">/invoke</code> endpoint:
        </p>
        <CodeBlock>{`curl -X POST https://gateway.inbotwetrust.com/api/v1/mcp/github-mcp-id/invoke \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tool": "search_repositories",
    "arguments": { "query": "mcp language:typescript" }
  }'`}</CodeBlock>
        <p className="text-[#888] mt-4">
          If the tool has a price, you&apos;ll get an HTTP 402 response with payment requirements.
          See <Link href="/docs/payments" className="text-[#d4af37] hover:underline">Payments (x402)</Link> for details.
        </p>
      </DocSection>

      <DocSection title="5. Check Usage">
        <p className="text-[#888] mb-4">
          View your call history and payments:
        </p>
        <CodeBlock>{`curl https://gateway.inbotwetrust.com/api/v1/billing/usage \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</CodeBlock>
      </DocSection>
    </>
  );
}
