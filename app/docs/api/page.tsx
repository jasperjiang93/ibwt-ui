import { EndpointRow } from "@/components/docs/endpoint-row";

const endpoints = [
  { method: "POST", path: "/api/v1/auth/keys", auth: true, description: "Create API key (wallet signature)" },
  { method: "GET", path: "/api/v1/auth/keys", auth: true, description: "List your API keys" },
  { method: "DELETE", path: "/api/v1/auth/keys/:id", auth: true, description: "Revoke an API key" },
  { method: "GET", path: "/api/v1/mcp/list", auth: false, description: "List all MCP servers" },
  { method: "GET", path: "/api/v1/mcp/:id", auth: false, description: "Get MCP server details" },
  { method: "GET", path: "/api/v1/mcp/:id/tools", auth: false, description: "Get tools with pricing" },
  { method: "POST", path: "/api/v1/mcp/register", auth: true, description: "Register new MCP server" },
  { method: "PUT", path: "/api/v1/mcp/:id", auth: true, description: "Update MCP server" },
  { method: "DELETE", path: "/api/v1/mcp/:id", auth: true, description: "Delete MCP server" },
  { method: "POST", path: "/api/v1/mcp/:id/refresh", auth: true, description: "Refresh/discover tools" },
  { method: "POST", path: "/api/v1/mcp/:id/invoke", auth: true, description: "Invoke a tool (x402 payment)" },
  { method: "POST", path: "/api/v1/mcp/:id/messages", auth: true, description: "MCP protocol proxy (SSE)" },
  { method: "POST", path: "/api/v1/mcp/gateway", auth: true, description: "Unified gateway endpoint (JSON-RPC)" },
  { method: "GET", path: "/api/v1/agents", auth: false, description: "List all agents" },
  { method: "GET", path: "/api/v1/agents/:id", auth: false, description: "Get agent details + skills" },
  { method: "GET", path: "/api/v1/agents/:id/agent-card", auth: false, description: "A2A Agent Card" },
  { method: "POST", path: "/api/v1/agents/register", auth: true, description: "Register new agent" },
  { method: "PUT", path: "/api/v1/agents/:id", auth: true, description: "Update agent" },
  { method: "DELETE", path: "/api/v1/agents/:id", auth: true, description: "Delete agent" },
  { method: "POST", path: "/api/v1/agents/:id/refresh", auth: true, description: "Refresh agent skills" },
  { method: "POST", path: "/api/v1/agents/:id/a2a", auth: true, description: "A2A proxy (x402 payment)" },
  { method: "POST", path: "/api/v1/credentials", auth: true, description: "Store credential (auto-refreshes tools)" },
  { method: "GET", path: "/api/v1/credentials", auth: true, description: "List stored credentials" },
  { method: "DELETE", path: "/api/v1/credentials/:mcp_id", auth: true, description: "Delete credential" },
  { method: "GET", path: "/api/v1/billing/history", auth: true, description: "Payment history" },
  { method: "GET", path: "/api/v1/billing/usage", auth: true, description: "Call usage history" },
  { method: "POST", path: "/api/v1/oauth/:mcp_id/start", auth: true, description: "Start OAuth flow" },
  { method: "GET", path: "/api/v1/oauth/callback", auth: false, description: "OAuth callback handler" },
];

export default function APIReferencePage() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">API Reference</h1>
      <p className="text-[#888] text-lg mb-4">
        All endpoints are prefixed with <code className="text-[#ccc]">https://gateway.inbotwetrust.com</code>.
        Auth = requires <code className="text-[#ccc]">Authorization: Bearer API_KEY</code> header.
      </p>
      <p className="text-[#888] mb-12">
        Base URL: <code className="text-[#d4af37]">https://gateway.inbotwetrust.com</code>
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-3 px-4 font-medium">Endpoint</th>
              <th className="text-left py-3 px-4 font-medium">Method</th>
              <th className="text-left py-3 px-4 font-medium">Auth</th>
              <th className="text-left py-3 px-4 font-medium">Description</th>
            </tr>
          </thead>
          <tbody className="text-[#888]">
            {endpoints.map((ep, i) => (
              <EndpointRow key={i} {...ep} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
