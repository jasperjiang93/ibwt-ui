"use client";

import { useState } from "react";
import { useGatewayStore } from "@/lib/gateway-store";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080";
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

export default function DeveloperPage() {
  const { apiKey } = useGatewayStore();
  const [revealed, setRevealed] = useState(false);

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
          Point your agents to this URL to access all registered MCP tools.
        </p>
        <div className="flex items-center gap-3">
          <code className="flex-1 px-4 py-2.5 bg-[rgba(255,255,255,0.03)] border border-gray-800 rounded-lg text-sm font-mono text-[#ccc] truncate">
            {GATEWAY_ENDPOINT}
          </code>
          <CopyButton text={GATEWAY_ENDPOINT} />
        </div>
      </div>

      {/* Quick Start */}
      <div className="border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold mb-1">Quick Start</h2>
        <p className="text-sm text-[#888] mb-4">
          List all available tools via the gateway:
        </p>
        <div className="relative">
          <pre className="px-4 py-3 bg-[rgba(255,255,255,0.03)] border border-gray-800 rounded-lg text-sm font-mono text-[#ccc] overflow-x-auto">
{`curl -X POST ${GATEWAY_ENDPOINT} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'`}
          </pre>
        </div>
      </div>
    </div>
  );
}
