"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  gateway,
  type DiscoveredTool,
  type RegisterMCPRequest,
  type RegisterAuthConfig,
} from "@/lib/api";
import { useGatewayStore } from "@/lib/gateway-store";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";


interface HeaderEntry {
  key: string;
  value: string;
}

interface ToolWithPrice extends DiscoveredTool {
  price_usd: number;
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

  // Credential config state
  const [requiresConfig, setRequiresConfig] = useState(false);
  const [credentials, setCredentials] = useState<
    {
      name: string;
      required: boolean;
      description: string;
      auth_type: "static" | "oauth";
      auth_url: string;
      token_url: string;
      client_id: string;
      client_secret: string;
      scopes: string;
    }[]
  >([{ name: "", required: true, description: "", auth_type: "static", auth_url: "", token_url: "", client_id: "", client_secret: "", scopes: "" }]);
  const [configHeaders, setConfigHeaders] = useState<
    { key: string; value: string }[]
  >([{ key: "Authorization", value: "Bearer {TOKEN_NAME}" }]);
  const [configQueryParams, setConfigQueryParams] = useState<
    { key: string; value: string }[]
  >([]);

  // Temporary test credentials for discovery (NOT stored)
  const [testAuthType, setTestAuthType] = useState<"header" | "query">("header");
  const [testHeaderKey, setTestHeaderKey] = useState("Authorization");
  const [testHeaderValue, setTestHeaderValue] = useState("");
  const [testQueryKey, setTestQueryKey] = useState("");
  const [testQueryValue, setTestQueryValue] = useState("");
  const [showAuthHint, setShowAuthHint] = useState(false);

  // Discover mutation
  const discoverMutation = useMutation({
    mutationFn: () => {
      const upstream_headers: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.key.trim() && h.value.trim()) {
          upstream_headers[h.key.trim()] = h.value.trim();
        }
      });
      // Add test credentials if provided (for discovery only, NOT stored)
      if (testAuthType === "header" && testHeaderKey.trim() && testHeaderValue.trim()) {
        upstream_headers[testHeaderKey.trim()] = testHeaderValue.trim();
      }

      // Build endpoint with query params if needed
      let discoverEndpoint = endpoint;
      if (testAuthType === "query" && testQueryKey.trim() && testQueryValue.trim()) {
        const url = new URL(endpoint);
        url.searchParams.set(testQueryKey.trim(), testQueryValue.trim());
        discoverEndpoint = url.toString();
      }

      return gateway.discoverMCP({
        endpoint: discoverEndpoint,
        upstream_headers:
          Object.keys(upstream_headers).length > 0
            ? upstream_headers
            : undefined,
      });
    },
    onSuccess: (data) => {
      // Check if MCP requires auth (returned from backend)
      if (data.requires_auth) {
        setShowAuthHint(true);
        return;
      }

      setShowAuthHint(false);
      setDiscoveredTools(
        data.tools.map((t) => ({
          ...t,
          price_usd: 0,
          enabled: true,
        }))
      );
      // If we used test credentials, this MCP requires user credentials - prefill config
      const usedTestCreds = 
        (testAuthType === "header" && testHeaderValue.trim()) ||
        (testAuthType === "query" && testQueryValue.trim());
      
      if (usedTestCreds) {
        setRequiresConfig(true);
        
        // Prefill config based on what was used for discovery
        if (testAuthType === "header" && testHeaderKey.trim()) {
          setCredentials([{ name: "API_TOKEN", required: true, description: "", auth_type: "static", auth_url: "", token_url: "", client_id: "", client_secret: "", scopes: "" }]);
          setConfigHeaders([{ key: testHeaderKey, value: testHeaderValue.includes("Bearer") ? "Bearer {API_TOKEN}" : "{API_TOKEN}" }]);
          setConfigQueryParams([]);
        } else if (testAuthType === "query" && testQueryKey.trim()) {
          const credName = testQueryKey.toUpperCase().replace(/[^A-Z0-9]/g, "_");
          setCredentials([{ name: credName, required: true, description: "", auth_type: "static", auth_url: "", token_url: "", client_id: "", client_secret: "", scopes: "" }]);
          setConfigHeaders([]);
          setConfigQueryParams([{ key: testQueryKey, value: `{${credName}}` }]);
        }
        
        // Clear test credentials
        setTestHeaderValue("");
        setTestQueryValue("");
      }
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

    // Build auth_configs from credentials
    const authConfigs: RegisterAuthConfig[] = requiresConfig
      ? credentials
          .filter((c) => c.name.trim())
          .map((c) => {
            const config: RegisterAuthConfig = {
              credential_name: c.name.trim(),
              auth_type: c.auth_type,
              required: c.required,
              description: c.description || undefined,
            };
            if (c.auth_type === "oauth") {
              if (c.auth_url.trim()) config.auth_url = c.auth_url.trim();
              if (c.token_url.trim()) config.token_url = c.token_url.trim();
              if (c.client_id.trim()) config.client_id = c.client_id.trim();
              if (c.client_secret.trim()) config.client_secret = c.client_secret.trim();
              if (c.scopes.trim()) config.scopes = c.scopes.split(",").map((s) => s.trim()).filter(Boolean);
            }
            return config;
          })
      : [];

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
          price_usd: t.price_usd,
        })),
      discovered_tools: discoveredTools
        .filter((t) => t.enabled)
        .map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.input_schema,
        })),
      tags: tags.length ? tags : undefined,
      requires_config: requiresConfig,
      config_schema: requiresConfig
        ? {
            headers: configHeaders
              .filter((h) => h.key.trim() && h.value.trim())
              .map((h) => ({ key: h.key.trim(), value: h.value.trim() })),
            query_params: configQueryParams
              .filter((qp) => qp.key.trim() && qp.value.trim())
              .map((qp) => ({ key: qp.key.trim(), value: qp.value.trim() })),
          }
        : undefined,
      auth_configs: authConfigs.length > 0 ? authConfigs : undefined,
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
    next[idx] = { ...next[idx], price_usd: price };
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
        <Alert variant="warning" className="mb-6">
          Gateway not connected. Please reconnect your wallet or refresh the page.
        </Alert>
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

          {(showAuthHint || discoverMutation.error) && (
            <div className="space-y-3">
              {discoverMutation.error && !showAuthHint && (
                <Alert>
                  {discoverMutation.error instanceof Error
                    ? discoverMutation.error.message
                    : "Failed to connect"}
                </Alert>
              )}
              <div className="p-4 border border-yellow-800 bg-yellow-900/20 rounded-lg space-y-3">
                <p className="text-sm text-yellow-400">
                  This MCP requires authentication. Provide a <strong>test credential</strong> for discovery only.
                  This will <strong>NOT</strong> be stored.
                </p>
                
                {/* Auth Type Selection */}
                <div className="flex gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setTestAuthType("header")}
                    className={`px-3 py-1 rounded ${testAuthType === "header" ? "bg-yellow-700 text-white" : "bg-gray-800 text-[#888]"}`}
                  >
                    Header
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestAuthType("query")}
                    className={`px-3 py-1 rounded ${testAuthType === "query" ? "bg-yellow-700 text-white" : "bg-gray-800 text-[#888]"}`}
                  >
                    Query Param
                  </button>
                </div>

                {testAuthType === "header" ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Header name (e.g. Authorization)"
                      className="input w-full"
                      value={testHeaderKey}
                      onChange={(e) => setTestHeaderKey(e.target.value)}
                    />
                    <input
                      type="password"
                      placeholder="Header value (e.g. Bearer xxx)"
                      className="input w-full"
                      value={testHeaderValue}
                      onChange={(e) => setTestHeaderValue(e.target.value)}
                    />
                    <p className="text-xs text-[#666]">Common: Authorization = Bearer YOUR_TOKEN</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Param name (e.g. exaApiKey)"
                      className="input w-full"
                      value={testQueryKey}
                      onChange={(e) => setTestQueryKey(e.target.value)}
                    />
                    <input
                      type="password"
                      placeholder="Param value (your API key)"
                      className="input w-full"
                      value={testQueryValue}
                      onChange={(e) => setTestQueryValue(e.target.value)}
                    />
                    <p className="text-xs text-[#666]">Will append ?{testQueryKey || "apiKey"}=xxx to endpoint</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={discoverMutation.isPending || (testAuthType === "header" ? !testHeaderValue.trim() : !testQueryValue.trim())}
                  className="px-4 py-2 bg-yellow-700 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 transition disabled:opacity-50"
                >
                  {discoverMutation.isPending ? "Connecting..." : "Retry with Credentials"}
                </button>

                <p className="text-xs text-[#666]">
                  Or configure credentials manually and discover tools later:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setRequiresConfig(true);
                    setDiscoveredTools([]);
                    setStep(2);
                  }}
                  className="text-xs text-[#888] hover:text-[#d4af37] underline"
                >
                  Skip discovery →
                </button>
              </div>
            </div>
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

          {/* Credential Requirements */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">User Credentials Required</h3>
                <p className="text-xs text-[#888] mt-1">
                  Enable if users need to provide their own API keys to use this MCP
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRequiresConfig(!requiresConfig)}
                className={`w-12 h-6 rounded-full transition ${
                  requiresConfig ? "bg-[#d4af37]" : "bg-gray-700"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition transform ${
                    requiresConfig ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {requiresConfig && (
              <div className="space-y-4 pt-4 border-t border-gray-800">
                {/* Credentials */}
                <div>
                  <label className="block text-sm text-[#888] mb-2">
                    Required Credentials
                  </label>
                  {credentials.map((cred, i) => (
                    <div key={i} className="border border-gray-800 rounded-lg p-3 mb-3">
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={cred.name}
                          onChange={(e) => {
                            const next = [...credentials];
                            next[i] = { ...next[i], name: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") };
                            setCredentials(next);
                          }}
                          placeholder="GITHUB_TOKEN"
                          className="input flex-1"
                        />
                        <input
                          type="text"
                          value={cred.description}
                          onChange={(e) => {
                            const next = [...credentials];
                            next[i] = { ...next[i], description: e.target.value };
                            setCredentials(next);
                          }}
                          placeholder="Description (optional)"
                          className="input flex-1"
                        />
                        {credentials.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setCredentials(credentials.filter((_, j) => j !== i))}
                            className="px-2 text-[#888] hover:text-red-400"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {/* Auth Type Toggle */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-[#888]">Auth type:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...credentials];
                            next[i] = { ...next[i], auth_type: "static" };
                            setCredentials(next);
                          }}
                          className={`px-2 py-0.5 text-xs rounded ${cred.auth_type === "static" ? "bg-[#d4af37] text-black" : "bg-gray-800 text-[#888]"}`}
                        >
                          Static
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...credentials];
                            next[i] = { ...next[i], auth_type: "oauth" };
                            setCredentials(next);
                          }}
                          className={`px-2 py-0.5 text-xs rounded ${cred.auth_type === "oauth" ? "bg-[#d4af37] text-black" : "bg-gray-800 text-[#888]"}`}
                        >
                          OAuth
                        </button>
                      </div>

                      {/* OAuth-specific fields */}
                      {cred.auth_type === "oauth" && (
                        <div className="space-y-2 pt-2 border-t border-gray-800">
                          <input
                            type="text"
                            value={cred.auth_url}
                            onChange={(e) => {
                              const next = [...credentials];
                              next[i] = { ...next[i], auth_url: e.target.value };
                              setCredentials(next);
                            }}
                            placeholder="Auth URL (e.g. https://github.com/login/oauth/authorize)"
                            className="input w-full"
                          />
                          <input
                            type="text"
                            value={cred.token_url}
                            onChange={(e) => {
                              const next = [...credentials];
                              next[i] = { ...next[i], token_url: e.target.value };
                              setCredentials(next);
                            }}
                            placeholder="Token URL (e.g. https://github.com/login/oauth/access_token)"
                            className="input w-full"
                          />
                          <input
                            type="text"
                            value={cred.client_id}
                            onChange={(e) => {
                              const next = [...credentials];
                              next[i] = { ...next[i], client_id: e.target.value };
                              setCredentials(next);
                            }}
                            placeholder="Client ID"
                            className="input w-full"
                          />
                          <input
                            type="password"
                            value={cred.client_secret}
                            onChange={(e) => {
                              const next = [...credentials];
                              next[i] = { ...next[i], client_secret: e.target.value };
                              setCredentials(next);
                            }}
                            placeholder="Client Secret"
                            className="input w-full"
                          />
                          <input
                            type="text"
                            value={cred.scopes}
                            onChange={(e) => {
                              const next = [...credentials];
                              next[i] = { ...next[i], scopes: e.target.value };
                              setCredentials(next);
                            }}
                            placeholder="Scopes (comma-separated, e.g. repo,user)"
                            className="input w-full"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setCredentials([...credentials, { name: "", required: true, description: "", auth_type: "static", auth_url: "", token_url: "", client_id: "", client_secret: "", scopes: "" }])
                    }
                    className="text-xs text-[#888] hover:text-[#d4af37]"
                  >
                    + Add Credential
                  </button>
                </div>

                {/* Header Injection */}
                <div>
                  <label className="block text-sm text-[#888] mb-2">
                    Header Injection (use {"{TOKEN_NAME}"} as placeholder)
                  </label>
                  {configHeaders.map((h, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={h.key}
                        onChange={(e) => {
                          const next = [...configHeaders];
                          next[i] = { ...next[i], key: e.target.value };
                          setConfigHeaders(next);
                        }}
                        placeholder="Header Key"
                        className="input w-40 shrink-0"
                      />
                      <input
                        type="text"
                        value={h.value}
                        onChange={(e) => {
                          const next = [...configHeaders];
                          next[i] = { ...next[i], value: e.target.value };
                          setConfigHeaders(next);
                        }}
                        placeholder="Bearer {GITHUB_TOKEN}"
                        className="input flex-1 min-w-0"
                      />
                      {configHeaders.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setConfigHeaders(configHeaders.filter((_, j) => j !== i))}
                          className="px-2 text-[#888] hover:text-red-400"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setConfigHeaders([...configHeaders, { key: "", value: "" }])
                    }
                    className="text-xs text-[#888] hover:text-[#d4af37]"
                  >
                    + Add Header
                  </button>
                </div>

                {/* Query Params Injection */}
                <div>
                  <label className="block text-sm text-[#888] mb-2">
                    Query Parameters (use {"{TOKEN_NAME}"} as placeholder)
                  </label>
                  {configQueryParams.length === 0 ? (
                    <p className="text-xs text-[#666] mb-2">No query params configured</p>
                  ) : (
                    configQueryParams.map((qp, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={qp.key}
                          onChange={(e) => {
                            const next = [...configQueryParams];
                            next[i] = { ...next[i], key: e.target.value };
                            setConfigQueryParams(next);
                          }}
                          placeholder="Key"
                          className="input w-32 shrink-0"
                        />
                        <input
                          type="text"
                          value={qp.value}
                          onChange={(e) => {
                            const next = [...configQueryParams];
                            next[i] = { ...next[i], value: e.target.value };
                            setConfigQueryParams(next);
                          }}
                          placeholder="{EXA_API_KEY}"
                          className="input flex-1 min-w-0"
                        />
                        <button
                          type="button"
                          onClick={() => setConfigQueryParams(configQueryParams.filter((_, j) => j !== i))}
                          className="px-2 text-[#888] hover:text-red-400"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setConfigQueryParams([...configQueryParams, { key: "", value: "" }])
                    }
                    className="text-xs text-[#888] hover:text-[#d4af37]"
                  >
                    + Add Query Param
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Discovered tools */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">
              Discovered Tools ({discoveredTools.length})
            </h2>

            {discoveredTools.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-[#888]">
                  {requiresConfig
                    ? "Tools will be discovered after users configure their credentials and call refresh."
                    : "No tools discovered from this endpoint"}
                </p>
                {requiresConfig && (
                  <p className="text-xs text-[#666] mt-2">
                    You can set default pricing after registration via the MCP settings.
                  </p>
                )}
              </div>
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
                      <div className="shrink-0">
                        <input
                          type="number"
                          step="0.000001"
                          min="0"
                          value={tool.price_usd || ""}
                          onChange={(e) => updateToolPrice(i, parseFloat(e.target.value) || 0)}
                          disabled={!tool.enabled}
                          placeholder="0.001"
                          className="input text-sm w-28"
                        />
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
            <Alert>
              {registerMutation.error instanceof Error
                ? registerMutation.error.message
                : "Failed to register MCP"}
            </Alert>
          )}
        </form>
      )}
    </div>
  );
}

