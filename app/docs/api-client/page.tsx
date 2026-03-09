import { CodeBlock } from "@/components/docs/code-block";
import { DocSection } from "@/components/docs/doc-section";
import { TabGroup } from "@/components/docs/tab-group";
import Link from "next/link";

export default function ApiClientPage() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">API / Custom Client</h1>
      <p className="text-[#888] text-lg mb-12">
        Integrate the IBWT gateway directly into your application using the MCP
        protocol (JSON-RPC) or REST API.
      </p>

      <DocSection title="Gateway Endpoint">
        <p className="text-[#888] mb-4">
          All MCP protocol requests go to a single endpoint:
        </p>
        <CodeBlock>https://gateway.inbotwetrust.com/api/v1/mcp/gateway</CodeBlock>
        <p className="text-[#888] mt-4">
          Authenticate with your API key in the{" "}
          <code className="text-[#ccc]">Authorization</code> header:
        </p>
        <CodeBlock>Authorization: Bearer YOUR_API_KEY</CodeBlock>
      </DocSection>

      <DocSection title="Initialize Session">
        <p className="text-[#888] mb-4">
          Start an MCP session. The response includes a{" "}
          <code className="text-[#ccc]">Mcp-Session-Id</code> header you can
          use for subsequent requests.
        </p>
        <CodeBlock title="POST /api/v1/mcp/gateway">{`curl -X POST https://gateway.inbotwetrust.com/api/v1/mcp/gateway \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "id": 1
  }'`}</CodeBlock>
      </DocSection>

      <DocSection title="List Available Tools">
        <p className="text-[#888] mb-4">
          After initializing, list all tools available to you. This includes
          the gateway&apos;s built-in discovery tools plus tools from any servers
          you&apos;ve subscribed to.
        </p>
        <CodeBlock title="POST /api/v1/mcp/gateway">{`curl -X POST https://gateway.inbotwetrust.com/api/v1/mcp/gateway \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"tools/list","id":2}'`}</CodeBlock>
        <p className="text-[#888] mt-4 text-sm">
          Tool names are prefixed with the server name:{" "}
          <code className="text-[#ccc]">ServerName__tool_name</code> (e.g.,{" "}
          <code className="text-[#ccc]">Vercel__list_projects</code>).
        </p>
      </DocSection>

      <DocSection title="Call a Tool">
        <p className="text-[#888] mb-4">
          Call any tool by its qualified name:
        </p>
        <CodeBlock title="POST /api/v1/mcp/gateway">{`curl -X POST https://gateway.inbotwetrust.com/api/v1/mcp/gateway \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "gateway__find_servers",
      "arguments": { "query": "database" }
    },
    "id": 3
  }'`}</CodeBlock>
      </DocSection>

      <DocSection title="A2A — Call an Agent">
        <p className="text-[#888] mb-4">
          Send tasks to AI agents using the A2A (Agent-to-Agent) protocol.
          See{" "}
          <Link
            href="/docs/agents"
            className="text-[#d4af37] hover:underline"
          >
            AI Agents (A2A)
          </Link>{" "}
          for the full protocol reference.
        </p>
        <CodeBlock title="POST /api/v1/agents/:id/a2a">{`curl -X POST https://gateway.inbotwetrust.com/api/v1/agents/AGENT_ID/a2a \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "message/send",
    "params": {
      "message": {
        "role": "user",
        "parts": [{ "kind": "text", "text": "Your task here" }]
      }
    },
    "id": 1
  }'`}</CodeBlock>
      </DocSection>

      <DocSection title="SDKs">
        <p className="text-[#888] mb-4">
          Python and TypeScript SDKs are coming soon. For now, use the raw
          JSON-RPC protocol above or any MCP client library — the gateway
          speaks standard MCP.
        </p>
        <TabGroup
          storageKey="sdk-lang"
          tabs={[
            {
              label: "Python",
              content: (
                <div className="p-4 rounded-lg bg-[rgba(212,175,55,0.05)] border border-[rgba(212,175,55,0.2)] text-sm text-[#888]">
                  <p className="font-medium text-[#ccc] mb-2">Coming Soon</p>
                  <p className="mb-3">
                    The Python SDK will provide a high-level client with
                    automatic session management, tool discovery, and payment
                    handling.
                  </p>
                  <CodeBlock>{`# Coming soon
from ibwt import Gateway

gw = Gateway(api_key="YOUR_API_KEY")
servers = gw.find_servers("database")
result = gw.call_tool("Neon__list_projects")`}</CodeBlock>
                </div>
              ),
            },
            {
              label: "TypeScript",
              content: (
                <div className="p-4 rounded-lg bg-[rgba(212,175,55,0.05)] border border-[rgba(212,175,55,0.2)] text-sm text-[#888]">
                  <p className="font-medium text-[#ccc] mb-2">Coming Soon</p>
                  <p className="mb-3">
                    The TypeScript SDK will provide a typed client for Node.js
                    and browser environments.
                  </p>
                  <CodeBlock>{`// Coming soon
import { Gateway } from "@ibwt/sdk";

const gw = new Gateway({ apiKey: "YOUR_API_KEY" });
const servers = await gw.findServers("database");
const result = await gw.callTool("Neon__list_projects");`}</CodeBlock>
                </div>
              ),
            },
          ]}
        />
      </DocSection>
    </>
  );
}
