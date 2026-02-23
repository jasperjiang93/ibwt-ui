"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  gateway,
  type DiscoveredTool,
  type RegisterMCPRequest,
} from "@/lib/api";
import { useGatewayStore } from "@/lib/gateway-store";

interface HeaderEntry {
  key: string;
  value: string;
}

interface ToolWithPrice extends DiscoveredTool {
  price_per_call: number;
  enabled: boolean;
}

export default function RegisterMCPPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { publicKey } = useWallet();
  const { apiKey } = useGatewayStore();

  // Step tracking
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 state
  const [endpoint, setEndpoint] = useState("");
  const [headers, setHeaders] = useState<HeaderEntry[]>([
    { key: "", value: "" },
  ]);

  // Step 2 state
  const [discoveredTools, setDiscoveredTools] = useState<ToolWithPrice[]>([]);
  const [name, setName] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  // Discover mutation
  const discoverMutation = useMutation({
    mutationFn: () => {
      const upstream_headers: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.key.trim() && h.value.trim()) {
          upstream_headers[h.key.trim()] = h.value.trim();
        }
      });
      return gateway.discoverMCP({
        endpoint,
        upstream_headers:
          Object.keys(upstream_headers).length > 0
            ? upstream_headers
            : undefined,
      });
    },
    onSuccess: (data) => {
      setDiscoveredTools(
        data.tools.map((t) => ({
          ...t,
          price_per_call: 0,
          enabled: true,
        }))
      );
      setStep(2);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (req: RegisterMCPRequest) => gateway.registerMCP(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-mcps"] });
      router.push("/dashboard/mcps");
    },
  });

  const handleDiscover = (e: React.FormEvent) => {
    e.preventDefault();
    discoverMutation.mutate();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const upstream_headers: Record<string, string> = {};
    headers.forEach((h) => {
      if (h.key.trim() && h.value.trim()) {
        upstream_headers[h.key.trim()] = h.value.trim();
      }
    });

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const walletAddress = publicKey?.toBase58() || "";

    const req: RegisterMCPRequest = {
      name,
      endpoint,
      owner_address: walletAddress,
      upstream_headers:
        Object.keys(upstream_headers).length > 0
          ? upstream_headers
          : undefined,
      tools: discoveredTools
        .filter((t) => t.enabled)
        .map((t) => ({
          name: t.name,
          price_per_call: t.price_per_call,
        })),
      tags: tags.length ? tags : undefined,
    };

    registerMutation.mutate(req);
  };

  const updateHeaderEntry = (
    idx: number,
    field: "key" | "value",
    val: string
  ) => {
    const next = [...headers];
    next[idx] = { ...next[idx], [field]: val };
    setHeaders(next);
  };

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "" }]);
  };

  const removeHeader = (idx: number) => {
    setHeaders(headers.filter((_, i) => i !== idx));
  };

  const updateToolPrice = (idx: number, price: number) => {
    const next = [...discoveredTools];
    next[idx] = { ...next[idx], price_per_call: price };
    setDiscoveredTools(next);
  };

  const toggleTool = (idx: number) => {
    const next = [...discoveredTools];
    next[idx] = { ...next[idx], enabled: !next[idx].enabled };
    setDiscoveredTools(next);
  };

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => router.push("/dashboard/mcps")}
        className="text-sm text-[#888] hover:text-white mb-4 block"
      >
        &larr; Back to MCPs
      </button>

      <h1 className="text-2xl font-bold mb-6">Register MCP</h1>

      {!apiKey && (
        <div className="mb-6 p-4 border border-yellow-800 bg-yellow-900/20 rounded-lg text-sm text-yellow-400">
          Gateway not connected. Please reconnect your wallet or refresh the page.
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-6 text-sm">
        <div
          className={`flex items-center gap-1.5 ${
            step === 1 ? "text-[#d4af37]" : "text-[#888]"
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              step === 1
                ? "bg-[#d4af37] text-black"
                : "bg-[rgba(212,175,55,0.2)] text-[#d4af37]"
            }`}
          >
            1
          </span>
          Connect
        </div>
        <div className="w-8 h-px bg-gray-700" />
        <div
          className={`flex items-center gap-1.5 ${
            step === 2 ? "text-[#d4af37]" : "text-[#666]"
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              step === 2
                ? "bg-[#d4af37] text-black"
                : "bg-gray-800 text-[#666]"
            }`}
          >
            2
          </span>
          Configure Tools
        </div>
      </div>

      {/* Step 1: Endpoint + Headers */}
      {step === 1 && (
        <form onSubmit={handleDiscover} className="card p-6 space-y-5">
          <Field label="Endpoint" required>
            <input
              type="url"
              required
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://my-mcp-server.com"
              className="input"
            />
          </Field>

          <div>
            <label className="block text-sm text-[#888] mb-2">
              Upstream Headers
            </label>
            <div className="space-y-2">
              {headers.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={h.key}
                    onChange={(e) => updateHeaderEntry(i, "key", e.target.value)}
                    placeholder="Header name"
                    className="input flex-1"
                  />
                  <input
                    type="text"
                    value={h.value}
                    onChange={(e) =>
                      updateHeaderEntry(i, "value", e.target.value)
                    }
                    placeholder="Header value"
                    className="input flex-[2]"
                  />
                  {headers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHeader(i)}
                      className="px-2 text-[#666] hover:text-red-400 transition"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addHeader}
              className="text-xs text-[#888] hover:text-[#d4af37] mt-2 transition"
            >
              + Add Header
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={discoverMutation.isPending}
              className="px-4 py-2 bg-[#d4af37] text-black font-medium rounded-lg hover:bg-[#c4a030] transition disabled:opacity-50"
            >
              {discoverMutation.isPending ? "Connecting..." : "Connect"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/mcps")}
              className="px-4 py-2 border border-gray-700 text-[#888] rounded-lg hover:bg-gray-800 transition"
            >
              Cancel
            </button>
          </div>

          {discoverMutation.error && (
            <p className="text-red-400 text-sm">
              {discoverMutation.error instanceof Error
                ? discoverMutation.error.message
                : "Failed to connect"}
            </p>
          )}
        </form>
      )}

      {/* Step 2: Discovered tools + pricing */}
      {step === 2 && (
        <form onSubmit={handleRegister} className="space-y-5">
          {/* Connection info */}
          <div className="card p-4 flex items-center justify-between">
            <div className="text-sm">
              <span className="text-[#888]">Endpoint:</span>{" "}
              <span className="text-[#ccc]">{endpoint}</span>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-[#888] hover:text-[#d4af37] transition"
            >
              Change
            </button>
          </div>

          {/* MCP name + tags */}
          <div className="card p-6 space-y-4">
            <Field label="Name" required>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My MCP Server"
                className="input"
              />
            </Field>

            <Field label="Tags (comma-separated)">
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="search, data, ai"
                className="input"
              />
            </Field>
          </div>

          {/* Discovered tools */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">
              Discovered Tools ({discoveredTools.length})
            </h2>

            {discoveredTools.length === 0 ? (
              <p className="text-[#888] text-center py-4">
                No tools discovered from this endpoint
              </p>
            ) : (
              <div className="space-y-3">
                {discoveredTools.map((tool, i) => (
                  <div
                    key={tool.name}
                    className={`border rounded-lg p-4 transition ${
                      tool.enabled
                        ? "border-gray-800"
                        : "border-gray-800/50 opacity-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={tool.enabled}
                          onChange={() => toggleTool(i)}
                          className="mt-1 accent-[#d4af37]"
                        />
                        <div className="min-w-0">
                          <h3 className="font-medium text-[#d4af37]">
                            {tool.name}
                          </h3>
                          <p className="text-sm text-[#888] mt-0.5">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min={0}
                          value={tool.price_per_call}
                          onChange={(e) =>
                            updateToolPrice(i, Number(e.target.value))
                          }
                          disabled={!tool.enabled}
                          className="input w-20 text-right text-sm"
                        />
                        <span className="text-xs text-[#666]">credits</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={
                registerMutation.isPending ||
                !name.trim() ||
                discoveredTools.filter((t) => t.enabled).length === 0
              }
              className="px-4 py-2 bg-[#d4af37] text-black font-medium rounded-lg hover:bg-[#c4a030] transition disabled:opacity-50"
            >
              {registerMutation.isPending ? "Registering..." : "Register MCP"}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-gray-700 text-[#888] rounded-lg hover:bg-gray-800 transition"
            >
              Back
            </button>
          </div>

          {registerMutation.error && (
            <p className="text-red-400 text-sm">
              {registerMutation.error instanceof Error
                ? registerMutation.error.message
                : "Failed to register MCP"}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm text-[#888] mb-1">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
