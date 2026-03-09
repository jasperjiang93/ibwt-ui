"use client";

import { useState } from "react";
import { useGatewayStore } from "@/lib/gateway-store";
import { TabGroup } from "@/components/docs/tab-group";
import Link from "next/link";

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080";
const GATEWAY_ENDPOINT = `${GATEWAY_URL}/api/v1/mcp/gateway`;

function maskKey(key: string) {
  if (key.length <= 12) return key;
  return `${key.slice(0, 8)}${"*".repeat(8)}${key.slice(-4)}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[rgba(212,175,55,0.3)] text-[#d4af37] hover:bg-[rgba(212,175,55,0.1)] transition"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function CodeWithCopy({ code }: { code: string }) {
  return (
    <div className="relative group">
      <pre className="px-4 py-3 bg-[rgba(255,255,255,0.03)] border border-gray-800 rounded-lg text-sm font-mono text-[#ccc] overflow-x-auto whitespace-pre-wrap">
        {code}
      </pre>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
        <CopyButton text={code} />
      </div>
    </div>
  );
}

export default function DeveloperPage() {
  const { apiKey } = useGatewayStore();
  const [revealed, setRevealed] = useState(false);

  const keyDisplay = apiKey || "YOUR_API_KEY";

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Developer</h1>

      {/* API Key */}
      <div className="border border-gray-800 rounded-xl p-5 mb-4">
        <h2 className="font-semibold mb-1">API Key</h2>
        <p className="text-sm text-[#888] mb-4">
          Use this key to authenticate requests to the IBWT gateway.
        </p>
        {apiKey ? (
          <div className="flex items-center gap-3">
            <code className="flex-1 px-4 py-2.5 bg-[rgba(255,255,255,0.03)] border border-gray-800 rounded-lg text-sm font-mono text-[#ccc] truncate">
              {revealed ? apiKey : maskKey(apiKey)}
            </code>
            <button
              onClick={() => setRevealed(!revealed)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-700 text-[#888] hover:text-[#ccc] hover:border-gray-600 transition"
            >
              {revealed ? "Hide" : "Reveal"}
            </button>
            <CopyButton text={apiKey} />
          </div>
        ) : (
          <p className="text-sm text-[#666]">
            No API key available. Connect your wallet to generate one.
          </p>
        )}
      </div>

      {/* Gateway Endpoint */}
      <div className="border border-gray-800 rounded-xl p-5 mb-4">
        <h2 className="font-semibold mb-1">Gateway Endpoint</h2>
        <p className="text-sm text-[#888] mb-4">
          Point your AI tools to this URL to access all registered MCP servers
          and agents.
        </p>
        <div className="flex items-center gap-3">
          <code className="flex-1 px-4 py-2.5 bg-[rgba(255,255,255,0.03)] border border-gray-800 rounded-lg text-sm font-mono text-[#ccc] truncate">
            {GATEWAY_ENDPOINT}
          </code>
          <CopyButton text={GATEWAY_ENDPOINT} />
        </div>
      </div>

      {/* Integration Guides */}
      <div className="border border-gray-800 rounded-xl p-5 mb-4">
        <h2 className="font-semibold mb-1">Integration</h2>
        <p className="text-sm text-[#888] mb-4">
          Copy the config for your AI tool. Your API key is pre-filled.
        </p>
        <TabGroup
          storageKey="dev-integration"
          tabs={[
            {
              label: "Claude Code",
              content: (
                <div>
                  <p className="text-xs text-[#888] mb-3">
                    Run in your terminal:
                  </p>
                  <CodeWithCopy
                    code={`claude mcp add ibwt-gateway \\\n  --transport http \\\n  -h "Authorization: Bearer ${keyDisplay}" \\\n  ${GATEWAY_ENDPOINT}`}
                  />
                </div>
              ),
            },
            {
              label: "Cursor",
              content: (
                <div>
                  <p className="text-xs text-[#888] mb-3">
                    Add to{" "}
                    <code className="text-[#ccc]">.cursor/mcp.json</code>:
                  </p>
                  <CodeWithCopy
                    code={JSON.stringify(
                      {
                        mcpServers: {
                          "ibwt-gateway": {
                            url: GATEWAY_ENDPOINT,
                            headers: {
                              Authorization: `Bearer ${keyDisplay}`,
                            },
                          },
                        },
                      },
                      null,
                      2
                    )}
                  />
                </div>
              ),
            },
            {
              label: "Windsurf",
              content: (
                <div>
                  <p className="text-xs text-[#888] mb-3">
                    Add to your Windsurf MCP config:
                  </p>
                  <CodeWithCopy
                    code={JSON.stringify(
                      {
                        mcpServers: {
                          "ibwt-gateway": {
                            serverUrl: GATEWAY_ENDPOINT,
                            headers: {
                              Authorization: `Bearer ${keyDisplay}`,
                            },
                          },
                        },
                      },
                      null,
                      2
                    )}
                  />
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* SDKs */}
      <div className="border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold mb-1">SDKs</h2>
        <p className="text-sm text-[#888]">
          Python and TypeScript SDKs are coming soon. See the{" "}
          <Link href="/docs/api-client" className="text-[#d4af37] hover:underline">
            API / Custom Client
          </Link>{" "}
          guide for raw HTTP integration.
        </p>
      </div>
    </div>
  );
}
