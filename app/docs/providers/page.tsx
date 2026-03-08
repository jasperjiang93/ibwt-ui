import Link from "next/link";
import { CodeBlock } from "@/components/docs/code-block";
import { DocSection } from "@/components/docs/doc-section";

export default function ProvidersDocPage() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">Provider Guide</h1>
      <p className="text-[#888] text-lg mb-12">
        Register your MCP server or A2A agent and earn SOL/IBWT tokens when others use your tools.
      </p>

      <DocSection title="Register an MCP">
        <p className="text-[#888] mb-4">
          <strong>Option 1:</strong> Use the{" "}
          <Link href="/dashboard/mcps/register" className="text-[#d4af37] hover:underline">
            Dashboard UI
          </Link>
          . Enter your MCP endpoint and we auto-discover available tools.
        </p>
        <p className="text-[#888] mb-4">
          <strong>Option 2:</strong> Use the API:
        </p>
        <CodeBlock>{`curl -X POST https://gateway.inbotwetrust.com/api/v1/mcp/register \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "my-mcp",
    "endpoint": "https://my-server.com/mcp",
    "description": "My awesome MCP server",
    "tools": [
      { "name": "my_tool", "price_usd": 0.001 }
    ]
  }'`}</CodeBlock>
      </DocSection>

      <DocSection title="Register an Agent">
        <CodeBlock>{`curl -X POST https://gateway.inbotwetrust.com/api/v1/agents/register \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "my-research-agent",
    "endpoint": "https://my-agent.com/a2a",
    "description": "Research agent that summarizes papers",
    "price_per_task": 0.01,
    "tags": ["research", "summarization"]
  }'`}</CodeBlock>
      </DocSection>

      <DocSection title="Require Authentication">
        <p className="text-[#888] mb-4">
          If your MCP needs API keys from users, set <code className="text-[#ccc]">requires_config: true</code> and
          provide a <code className="text-[#ccc]">config_schema</code>:
        </p>
        <CodeBlock>{`{
  "name": "github-mcp",
  "endpoint": "https://api.githubcopilot.com/mcp",
  "requires_config": true,
  "config_schema": {
    "credentials": [
      { "name": "GITHUB_TOKEN", "required": true, "description": "GitHub PAT" }
    ],
    "headers": [
      { "key": "Authorization", "value": "Bearer {GITHUB_TOKEN}" }
    ]
  }
}`}</CodeBlock>
      </DocSection>

      <DocSection title="Pricing & Revenue">
        <ul className="text-[#888] space-y-2 list-disc list-inside">
          <li>Set a price in USD per tool call (e.g., <code className="text-[#ccc]">0.001</code>)</li>
          <li><code className="text-[#ccc]">price_usd: 0</code> = free tool</li>
          <li>You receive <strong>90%</strong> of each payment (10% platform fee)</li>
          <li>Calling your own MCP/agent is always free</li>
          <li>Payments settle on-chain via x402 — see{" "}
            <Link href="/docs/payments" className="text-[#d4af37] hover:underline">Payments</Link>
          </li>
        </ul>
      </DocSection>

      <DocSection title="Health Checks">
        <p className="text-[#888]">
          The gateway pings your endpoint every 5 minutes. If unreachable, your MCP/agent
          is marked as <code className="text-[#ccc]">inactive</code> and won&apos;t appear in marketplace searches.
          It automatically re-activates when connectivity is restored.
        </p>
      </DocSection>
    </>
  );
}
