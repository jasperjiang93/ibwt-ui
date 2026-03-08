"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gateway, type CredentialInfo, type CreateCredentialResponse, type MCP, type AuthConfig } from "@/lib/api";
import { useGatewayStore } from "@/lib/gateway-store";
import { IconKey } from "@/components/icons";

export default function SecretsPage() {
  const { apiKey } = useGatewayStore();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedMCP, setSelectedMCP] = useState<MCP | null>(null);

  // OAuth callback handling
  const searchParams = useSearchParams();
  const oauthResult = searchParams.get("oauth");
  const oauthMcpId = searchParams.get("mcp_id");
  const oauthError = searchParams.get("error");

  const { data: credsData, isLoading: credsLoading } = useQuery({
    queryKey: ["credentials"],
    queryFn: () => gateway.listCredentials(),
    enabled: !!apiKey,
  });

  const { data: mcpsData } = useQuery({
    queryKey: ["mcps-for-secrets"],
    queryFn: () => gateway.listMCPs(),
    enabled: !!apiKey,
  });

  const credentials = credsData?.credentials || [];
  const mcps = mcpsData?.tools || [];
  const mcpsRequiringConfig = mcps.filter(
    (m) => m.requires_config || (m.auth_configs && m.auth_configs.length > 0)
  );

  const deleteMutation = useMutation({
    mutationFn: (mcpId: string) => gateway.deleteCredential(mcpId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Secrets</h1>
          <p className="text-[#888] text-sm mt-1">
            Manage API tokens for MCP services
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-[#d4af37] text-black font-medium rounded-lg hover:bg-[#c4a030] transition"
        >
          + Add Secret
        </button>
      </div>

      {oauthResult === "success" && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm flex items-center gap-2">
          <span>&#10003;</span> Authorization successful!{oauthMcpId && " Your OAuth credential has been saved."}
        </div>
      )}

      {oauthResult === "error" && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          OAuth authorization failed{oauthError ? `: ${oauthError}` : ". Please try again."}
        </div>
      )}

      {credsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 border border-gray-800 rounded-xl animate-pulse"
            >
              <div className="h-5 bg-gray-800 rounded w-1/4 mb-2" />
              <div className="h-4 bg-gray-800 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : credentials.length === 0 ? (
        <div className="text-center py-16 border border-gray-800 rounded-xl">
          <div className="mb-4 flex justify-center">
            <IconKey size={48} className="text-[#444]" />
          </div>
          <p className="text-[#888] mb-2">No secrets stored yet</p>
          <p className="text-sm text-[#666]">
            Add API tokens to use MCPs that require authentication
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {credentials.map((cred) => (
            <CredentialCard
              key={cred.id}
              credential={cred}
              mcps={mcps}
              onDelete={() => deleteMutation.mutate(cred.mcp_server_id)}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Add Secret Modal */}
      {isAdding && (
        <AddSecretModal
          mcps={mcpsRequiringConfig}
          existingCredentials={credentials}
          preselectedMCP={selectedMCP}
          onClose={() => {
            setIsAdding(false);
            setSelectedMCP(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["credentials"] });
            setIsAdding(false);
            setSelectedMCP(null);
          }}
        />
      )}
    </div>
  );
}

function CredentialCard({
  credential,
  mcps,
  onDelete,
  isDeleting,
}: {
  credential: CredentialInfo;
  mcps: MCP[];
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const mcp = mcps.find((m) => m.id === credential.mcp_server_id);

  return (
    <div className="p-4 border border-gray-800 rounded-xl flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{mcp?.name || credential.mcp_server_id}</span>
          <span className="text-xs px-2 py-0.5 bg-[rgba(255,255,255,0.05)] text-[#888] rounded">
            {credential.token_name}
          </span>
        </div>
        <div className="text-sm text-[#666] mt-1">
          Added {new Date(credential.created_at).toLocaleDateString()}
          {credential.last_used_at && (
            <span>
              {" "}
              · Last used {new Date(credential.last_used_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50"
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}

function AddSecretModal({
  mcps,
  existingCredentials,
  preselectedMCP,
  onClose,
  onSuccess,
}: {
  mcps: MCP[];
  existingCredentials: CredentialInfo[];
  preselectedMCP: MCP | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  // Find the first unstored credential for a given MCP
  const findNextCredential = (mcp: MCP): AuthConfig | undefined => {
    return mcp.auth_configs?.find(
      (c) => !existingCredentials.some(
        (ec) => ec.mcp_server_id === mcp.id && ec.token_name === c.credential_name
      )
    );
  };

  // Initialize state from preselectedMCP (computed once via lazy initializer)
  const [selectedMCPId, setSelectedMCPId] = useState(preselectedMCP?.id || "");
  const [tokenName, setTokenName] = useState(() => {
    if (preselectedMCP) {
      return findNextCredential(preselectedMCP)?.credential_name || "";
    }
    return "";
  });
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState(preselectedMCP?.name || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [createResult, setCreateResult] = useState<CreateCredentialResponse | null>(null);

  const selectedMCP = mcps.find((m) => m.id === selectedMCPId);

  const nextCred = selectedMCP ? findNextCredential(selectedMCP) : undefined;
  const tokenNameFromSchema = !!nextCred;
  const isOAuthCredential = nextCred?.auth_type === "oauth";

  // Auto-fill token name from auth_configs
  const handleMCPSelect = (mcp: MCP) => {
    setSelectedMCPId(mcp.id);
    setSearchQuery(mcp.name);
    setIsDropdownOpen(false);
    const nextCred = findNextCredential(mcp);
    setTokenName(nextCred?.credential_name || "");
  };

  const createMutation = useMutation({
    mutationFn: () =>
      gateway.createCredential({
        mcp_server_id: selectedMCPId,
        token_name: tokenName,
        token: token,
      }),
    onSuccess: (data) => {
      setCreateResult(data);
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      // If backend auto-refreshed tools after credential save, update MCP data
      if (data.auto_refreshed) {
        queryClient.invalidateQueries({ queryKey: ["mcp-tools", selectedMCPId] });
        queryClient.invalidateQueries({ queryKey: ["mcp", selectedMCPId] });
      }
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedMCPId) {
      setError("Please select an MCP");
      return;
    }
    if (!tokenName.trim()) {
      setError("Token name is required");
      return;
    }
    if (!token.trim()) {
      setError("Token value is required");
      return;
    }

    createMutation.mutate();
  };

  // Filter out MCPs that already have credentials for all auth_configs
  const availableMCPs = mcps.filter((mcp) => {
    const credNames = mcp.auth_configs?.map((c) => c.credential_name) || [];
    if (credNames.length === 0) return true;
    return !credNames.every((name) =>
      existingCredentials.some(
        (cred) => cred.mcp_server_id === mcp.id && cred.token_name === name
      )
    );
  });

  // Filter by search query
  const filteredMCPs = availableMCPs.filter(
    (mcp) =>
      mcp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mcp.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (createResult) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-[#0a0a0f] border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
          <h2 className="text-xl font-bold mb-4">Secret Saved</h2>

          <div className="space-y-3">
            {createResult.auto_refreshed && !createResult.auto_refresh_error && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm flex items-center gap-2">
                <span>&#10003; Connected! Discovered {createResult.num_tools} tool{createResult.num_tools !== 1 ? "s" : ""}</span>
              </div>
            )}

            {createResult.auto_refresh_error && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm">
                Credential saved but connection failed: {createResult.auto_refresh_error}
              </div>
            )}

            {!createResult.auto_refreshed && !createResult.auto_refresh_error && (
              <div className="p-3 bg-[rgba(255,255,255,0.05)] border border-gray-800 rounded-lg text-[#888] text-sm">
                Credential saved successfully.
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={onSuccess}
              className="w-full px-4 py-2 bg-[#d4af37] text-black font-medium rounded-lg hover:bg-[#c4a030] transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#0a0a0f] border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Add Secret</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className="block text-sm text-[#888] mb-2">MCP Service</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
                if (!e.target.value) setSelectedMCPId("");
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Search MCPs..."
              className="w-full px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4af37]"
            />
            {isDropdownOpen && filteredMCPs.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-[#0a0a0f] border border-gray-800 rounded-lg max-h-48 overflow-y-auto">
                {filteredMCPs.map((mcp) => (
                  <button
                    key={mcp.id}
                    type="button"
                    onClick={() => handleMCPSelect(mcp)}
                    className={`w-full px-4 py-2 text-left hover:bg-[rgba(255,255,255,0.05)] ${
                      selectedMCPId === mcp.id ? "bg-[rgba(212,175,55,0.1)] text-[#d4af37]" : ""
                    }`}
                  >
                    <div className="font-medium">{mcp.name}</div>
                    {mcp.description && (
                      <div className="text-xs text-[#666] truncate">{mcp.description}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
            {isDropdownOpen && filteredMCPs.length === 0 && searchQuery && (
              <div className="absolute z-10 w-full mt-1 bg-[#0a0a0f] border border-gray-800 rounded-lg p-3 text-[#666] text-sm">
                No MCPs found
              </div>
            )}
          </div>

          {selectedMCP?.auth_configs && selectedMCP.auth_configs.length > 0 && (
            <div className="p-4 bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.2)] rounded-lg">
              <p className="text-sm text-[#888] mb-3">Required credentials:</p>
              <div className="space-y-3">
                {selectedMCP.auth_configs.map((cred) => (
                  <div key={cred.credential_name}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#d4af37]">{cred.credential_name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.05)] text-[#666]">
                        {cred.auth_type}
                      </span>
                    </div>
                    {cred.description && (
                      <p className="text-sm text-[#888] mt-1">
                        {cred.description.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                          /^https?:\/\//.test(part) ? (
                            <a
                              key={i}
                              href={part}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#d4af37] underline underline-offset-2 hover:text-[#e8c84a]"
                            >
                              {part}
                            </a>
                          ) : (
                            <span key={i}>{part}</span>
                          )
                        )}
                      </p>
                    )}
                    {cred.auth_type === "oauth" && (
                      <div className="mt-2">
                        <a
                          href={gateway.getOAuthAuthorizeURL(selectedMCPId, cred.credential_name)}
                          className="w-full px-4 py-2 bg-[#d4af37] text-black font-medium rounded-lg hover:bg-[#c4a030] transition text-center block"
                        >
                          Authorize with {cred.credential_name}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!tokenNameFromSchema && !isOAuthCredential && (
            <div>
              <label className="block text-sm text-[#888] mb-2">Token Name</label>
              <input
                type="text"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="e.g. GITHUB_TOKEN"
                className="w-full px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          )}

          {!isOAuthCredential && (
            <div>
              <label className="block text-sm text-[#888] mb-2">Token Value</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your API token"
                className="w-full px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4af37]"
              />
              <p className="text-xs text-[#666] mt-1">
                Your token will be encrypted and stored securely
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-800 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition"
            >
              Cancel
            </button>
            {!isOAuthCredential && (
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 px-4 py-2 bg-[#d4af37] text-black font-medium rounded-lg hover:bg-[#c4a030] transition disabled:opacity-50"
              >
                {createMutation.isPending ? "Saving..." : "Save Secret"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
