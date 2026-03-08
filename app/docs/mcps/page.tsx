import Link from "next/link";
import { CodeBlock } from "@/components/docs/code-block";
import { DocSection } from "@/components/docs/doc-section";

export default function MCPsDocPage() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">MCPs</h1>
      <p className="text-[#888] text-lg mb-12">
        MCP (Model Context Protocol) lets AI agents call tools through a standardized interface.
        IBWT aggregates 50+ MCP servers behind one gateway.
      </p>

      <DocSection title="Discover MCPs">
        <p className="text-[#888] mb-4">
          List all available MCP servers — no auth required:
        </p>
        <CodeBlock>{`curl https://gateway.inbotwetrust.com/api/v1/mcp/list`}</CodeBlock>
        <p className="text-[#888] mt-4 mb-4">
          View tools for a specific MCP:
        </p>
        <CodeBlock>{`curl https://gateway.inbotwetrust.com/api/v1/mcp/github-mcp-id/tools`}</CodeBlock>
      </DocSection>

      <DocSection title="Invoke a Tool">
        <p className="text-[#888] mb-4">
          Call any tool directly on a specific MCP:
        </p>
        <CodeBlock title="POST /api/v1/mcp/:id/invoke">{`curl -X POST https://gateway.inbotwetrust.com/api/v1/mcp/github-mcp-id/invoke \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tool": "search_repositories",
    "arguments": {
      "query": "mcp language:typescript",
      "page": 1,
      "perPage": 5
    }
  }'`}</CodeBlock>
      </DocSection>

      <DocSection title="Unified Gateway Endpoint">
        <p className="text-[#888] mb-4">
          Access all MCP tools through a single MCP-compatible endpoint. Tool names are
          prefixed with the MCP name (e.g., <code className="text-[#ccc]">github__search_repositories</code>).
        </p>
        <CodeBlock title="List all tools (JSON-RPC)">{`curl -X POST https://gateway.inbotwetrust.com/api/v1/mcp/gateway \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'`}</CodeBlock>

        <div className="mt-4" />

        <CodeBlock title="Call a tool (JSON-RPC)">{`curl -X POST https://gateway.inbotwetrust.com/api/v1/mcp/gateway \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "github__search_repositories",
      "arguments": { "query": "mcp" }
    },
    "id": 2
  }'`}</CodeBlock>
      </DocSection>

      <DocSection title="Authentication">
        <p className="text-[#888] mb-4">
          MCPs that require API keys (GitHub, Exa, etc.) need you to{" "}
          <Link href="/docs/credentials" className="text-[#d4af37] hover:underline">
            store credentials
          </Link>{" "}
          first. The gateway injects them automatically when you call the tool.
        </p>
      </DocSection>
    </>
  );
}
