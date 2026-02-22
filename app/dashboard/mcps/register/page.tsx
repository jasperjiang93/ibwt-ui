"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

interface ToolForm {
  name: string;
  description: string;
  pricingModel: "free" | "per_call" | "dynamic";
  priceUsd: string;
  inputSchema: string;
}

export default function RegisterMcpPage() {
  const router = useRouter();
  const { publicKey } = useWallet();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  
  // Server form
  const [serverName, setServerName] = useState("");
  const [serverDescription, setServerDescription] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [documentationUrl, setDocumentationUrl] = useState("");
  
  // Tools
  const [tools, setTools] = useState<ToolForm[]>([
    { name: "", description: "", pricingModel: "free", priceUsd: "", inputSchema: "" }
  ]);

  const addTool = () => {
    setTools([...tools, { name: "", description: "", pricingModel: "free", priceUsd: "", inputSchema: "" }]);
  };

  const removeTool = (index: number) => {
    if (tools.length > 1) {
      setTools(tools.filter((_, i) => i !== index));
    }
  };

  const updateTool = (index: number, field: keyof ToolForm, value: string) => {
    const newTools = [...tools];
    newTools[index] = { ...newTools[index], [field]: value };
    setTools(newTools);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicKey) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Register as merchant (or get existing)
      const merchantRes = await fetch("/api/merchant/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          name: serverName,
        }),
      });

      if (!merchantRes.ok) {
        throw new Error("Failed to register as merchant");
      }

      const merchant = await merchantRes.json();
      setApiKey(merchant.apiKey);

      // Step 2: Register MCP server
      const mcpRes = await fetch("/api/mcp/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": merchant.apiKey,
        },
        body: JSON.stringify({
          name: serverName,
          description: serverDescription,
          endpointUrl: endpointUrl || undefined,
          documentationUrl: documentationUrl || undefined,
          tools: tools.map((tool) => ({
            name: tool.name,
            description: tool.description || undefined,
            pricingModel: tool.pricingModel,
            priceUsd: tool.pricingModel !== "free" ? parseFloat(tool.priceUsd) : undefined,
            inputSchema: tool.inputSchema ? JSON.parse(tool.inputSchema) : undefined,
          })),
        }),
      });

      if (!mcpRes.ok) {
        const err = await mcpRes.json();
        throw new Error(err.error || "Failed to register MCP server");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="text-4xl mb-4">🔗</div>
        <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
        <p className="text-[#888] mb-6">
          Please connect your Solana wallet to register an MCP server.
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-xl font-semibold mb-2">MCP Registered Successfully!</h2>
          <p className="text-[#888] mb-6">
            Your MCP server is now live on the IBWT marketplace.
          </p>
          
          {apiKey && (
            <div className="bg-[rgba(0,0,0,0.3)] p-4 rounded-lg mb-6 text-left">
              <p className="text-sm text-[#888] mb-2">Your API Key (save this!):</p>
              <code className="text-[#d4af37] break-all">{apiKey}</code>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <Link href="/dashboard/mcps" className="btn-secondary">
              View My MCPs
            </Link>
            <Link href="/mcps" className="btn-primary">
              View Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard/mcps" className="text-[#888] hover:text-[#d4af37] mb-6 inline-block">
        ← Back to My MCPs
      </Link>

      <h1 className="text-2xl font-bold mb-2">Register MCP Server</h1>
      <p className="text-[#888] mb-6">
        Register your MCP server and start earning when AI agents use your tools.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Server Info */}
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Server Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#888] mb-1">Server Name *</label>
              <input
                type="text"
                required
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="e.g., Web Scraper Pro"
                className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(212,175,55,0.2)] rounded-lg text-[#e5e5e5] placeholder-[#666] focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#888] mb-1">Description</label>
              <textarea
                value={serverDescription}
                onChange={(e) => setServerDescription(e.target.value)}
                placeholder="What does your MCP server do?"
                rows={3}
                className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(212,175,55,0.2)] rounded-lg text-[#e5e5e5] placeholder-[#666] focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#888] mb-1">Endpoint URL</label>
              <input
                type="url"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                placeholder="https://your-server.com/mcp"
                className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(212,175,55,0.2)] rounded-lg text-[#e5e5e5] placeholder-[#666] focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#888] mb-1">Documentation URL</label>
              <input
                type="url"
                value={documentationUrl}
                onChange={(e) => setDocumentationUrl(e.target.value)}
                placeholder="https://docs.your-server.com"
                className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(212,175,55,0.2)] rounded-lg text-[#e5e5e5] placeholder-[#666] focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>
        </div>

        {/* Tools */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Tools</h2>
            <button
              type="button"
              onClick={addTool}
              className="text-sm text-[#d4af37] hover:underline"
            >
              + Add Tool
            </button>
          </div>

          <div className="space-y-6">
            {tools.map((tool, index) => (
              <div key={index} className="p-4 bg-[rgba(0,0,0,0.2)] rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-[#888]">Tool {index + 1}</span>
                  {tools.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTool(index)}
                      className="text-red-400 text-sm hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-[#888] mb-1">Tool Name *</label>
                    <input
                      type="text"
                      required
                      value={tool.name}
                      onChange={(e) => updateTool(index, "name", e.target.value)}
                      placeholder="e.g., scrape_page"
                      className="w-full px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(212,175,55,0.2)] rounded-lg text-[#e5e5e5] placeholder-[#666] focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#888] mb-1">Description</label>
                    <input
                      type="text"
                      value={tool.description}
                      onChange={(e) => updateTool(index, "description", e.target.value)}
                      placeholder="What does this tool do?"
                      className="w-full px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(212,175,55,0.2)] rounded-lg text-[#e5e5e5] placeholder-[#666] focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-[#888] mb-1">Pricing Model</label>
                      <select
                        value={tool.pricingModel}
                        onChange={(e) => updateTool(index, "pricingModel", e.target.value)}
                        className="w-full px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(212,175,55,0.2)] rounded-lg text-[#e5e5e5] focus:outline-none focus:border-[#d4af37]"
                      >
                        <option value="free">Free</option>
                        <option value="per_call">Per Call</option>
                        <option value="dynamic">Dynamic</option>
                      </select>
                    </div>

                    {tool.pricingModel !== "free" && (
                      <div>
                        <label className="block text-sm text-[#888] mb-1">Price (USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={tool.priceUsd}
                          onChange={(e) => updateTool(index, "priceUsd", e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(212,175,55,0.2)] rounded-lg text-[#e5e5e5] placeholder-[#666] focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-[#888] mb-1">Input Schema (JSON, optional)</label>
                    <textarea
                      value={tool.inputSchema}
                      onChange={(e) => updateTool(index, "inputSchema", e.target.value)}
                      placeholder='{"type": "object", "properties": {...}}'
                      rows={2}
                      className="w-full px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(212,175,55,0.2)] rounded-lg text-[#e5e5e5] placeholder-[#666] focus:outline-none focus:border-[#d4af37] font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Registering..." : "Register MCP Server"}
        </button>
      </form>
    </div>
  );
}
