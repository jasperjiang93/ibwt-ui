const API_BASE =
  process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080";

class GatewayClient {
  private baseURL: string;
  private token: string | null = null;
  private onUnauthorized: (() => void) | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getToken() {
    return this.token;
  }

  setOnUnauthorized(cb: (() => void) | null) {
    this.onUnauthorized = cb;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${this.baseURL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      if (res.status === 401 && this.token && this.onUnauthorized) {
        this.onUnauthorized();
      }
      const error = await res
        .json()
        .catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || error.error || `HTTP ${res.status}`);
    }

    return res.json();
  }

  // ============ Auth ============

  async challenge(walletAddress: string) {
    return this.request<ChallengeResponse>("POST", "/api/v1/auth/challenge", {
      wallet_address: walletAddress,
    });
  }

  async createKey(req: CreateKeyRequest) {
    return this.request<CreateKeyResponse>("POST", "/api/v1/auth/keys", req);
  }

  async getKey() {
    return this.request<{ api_key: APIKey }>("GET", "/api/v1/auth/keys");
  }

  async deleteKey() {
    return this.request<void>("DELETE", "/api/v1/auth/keys");
  }

  // ============ MCP ============

  async listMCPs() {
    return this.request<MCPListResponse>("GET", "/api/v1/mcp/list");
  }

  async getMCP(id: string) {
    return this.request<MCP>("GET", `/api/v1/mcp/${id}`);
  }

  async discoverMCP(req: DiscoverMCPRequest) {
    return this.request<DiscoverMCPResponse>(
      "POST",
      "/api/v1/mcp/discover",
      req
    );
  }

  async registerMCP(req: RegisterMCPRequest) {
    return this.request<RegisterMCPResponse>(
      "POST",
      "/api/v1/mcp/register",
      req
    );
  }

  async updateMCP(id: string, req: UpdateMCPRequest) {
    return this.request<{ success: boolean; message: string }>(
      "PUT",
      `/api/v1/mcp/${id}`,
      req
    );
  }

  async deleteMCP(id: string) {
    return this.request<void>("DELETE", `/api/v1/mcp/${id}`);
  }

  async refreshTools(id: string) {
    return this.request<RefreshToolsResponse>(
      "POST",
      `/api/v1/mcp/${id}/refresh`
    );
  }

  async getTools(id: string) {
    return this.request<{ tools: MCPToolEntry[] }>(
      "GET",
      `/api/v1/mcp/${id}/tools`
    );
  }

  async updateToolPrice(
    mcpId: string,
    toolName: string,
    priceUsd: number
  ) {
    return this.request<{ success: boolean; message: string }>(
      "PUT",
      `/api/v1/mcp/${mcpId}/tools/${toolName}/price`,
      { price_usd: priceUsd }
    );
  }

  // ============ Billing ============

  async getPaymentHistory(limit = 50, offset = 0) {
    return this.request<PaymentHistoryResponse>(
      "GET",
      `/api/v1/billing/history?limit=${limit}&offset=${offset}`
    );
  }

  async getUsage(limit = 50, offset = 0) {
    return this.request<UsageResponse>(
      "GET",
      `/api/v1/billing/usage?limit=${limit}&offset=${offset}`
    );
  }

  // ============ Credentials ============

  async listCredentials() {
    return this.request<CredentialsListResponse>("GET", "/api/v1/credentials");
  }

  async createCredential(req: CreateCredentialRequest) {
    return this.request<CreateCredentialResponse>("POST", "/api/v1/credentials", req);
  }

  async updateCredential(mcpId: string, req: UpdateCredentialRequest) {
    return this.request<{ message: string }>(
      "PUT",
      `/api/v1/credentials/${mcpId}`,
      req
    );
  }

  async deleteCredential(mcpId: string) {
    return this.request<{ message: string }>(
      "DELETE",
      `/api/v1/credentials/${mcpId}`
    );
  }

  // ============ OAuth ============

  // TODO: Token in URL leaks to browser history, server logs, and Referer header.
  // Backend should support session-based auth or short-lived state tokens for OAuth flows.
  getOAuthAuthorizeURL(mcpId: string, credentialName: string): string {
    const token = this.getToken();
    return `${this.baseURL}/api/v1/oauth/authorize?mcp_id=${mcpId}&credential_name=${encodeURIComponent(credentialName)}${token ? `&token=${token}` : ''}`;
  }

  // ============ Agents ============

  async listAgents(query?: string) {
    const q = query ? `?q=${encodeURIComponent(query)}` : "";
    return this.request<AgentListResponse>("GET", `/api/v1/agents${q}`);
  }

  async getAgent(id: string) {
    return this.request<AgentDetailResponse>("GET", `/api/v1/agents/${id}`);
  }

  async registerAgent(req: RegisterAgentRequest) {
    return this.request<{ success: boolean; message: string; agent: Agent }>(
      "POST",
      "/api/v1/agents/register",
      req
    );
  }

  async updateAgent(id: string, req: UpdateAgentRequest) {
    return this.request<{ success: boolean; message: string }>(
      "PUT",
      `/api/v1/agents/${id}`,
      req
    );
  }

  async deleteAgent(id: string) {
    return this.request<void>("DELETE", `/api/v1/agents/${id}`);
  }

  async refreshAgentSkills(id: string) {
    return this.request<{ success: boolean; num_skills: number; skills: AgentSkill[] }>(
      "POST",
      `/api/v1/agents/${id}/refresh`
    );
  }
}

export const gateway = new GatewayClient(API_BASE);

// ============ Auth Types ============

export interface ChallengeResponse {
  nonce: string;
  expires_at: string;
}

export interface CreateKeyRequest {
  wallet_address: string;
  signature: string;
  nonce: string;
}

export interface CreateKeyResponse {
  api_key: APIKey;
}

export interface APIKey {
  owner_address: string;
  key: string;
  created_at: string;
}

// ============ MCP Types ============

export interface ConfigSchema {
  headers: { key: string; value: string }[];
  query_params?: { key: string; value: string }[];
}

export interface AuthConfig {
  id: string;
  mcp_server_id: string;
  credential_name: string;
  auth_type: "static" | "oauth";
  required: boolean;
  description?: string;
  auth_url?: string;
  token_url?: string;
  client_id?: string;
  scopes?: string[];
}

export interface RegisterAuthConfig {
  credential_name: string;
  auth_type: "static" | "oauth";
  required: boolean;
  description?: string;
  auth_url?: string;
  token_url?: string;
  client_id?: string;
  client_secret?: string;
  scopes?: string[];
}

export interface MCP {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  transport: string;
  tags: string[];
  num_tools: number;
  owner_address: string;
  payout_address: string;
  currency: string;
  requires_config: boolean;
  config_schema?: ConfigSchema;
  auth_configs?: AuthConfig[];
  source: string;
  source_url?: string;
  is_verified: boolean;
  icon_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MCPListResponse {
  tools: MCP[];
  total: number;
}

export interface MCPToolEntry {
  id: string;
  server_id: string;
  tool_name: string;
  description: string;
  input_schema?: Record<string, unknown>;
  price_usd: number;
}

export interface DiscoverMCPRequest {
  endpoint: string;
  transport?: string;
  upstream_headers?: Record<string, string>;
}

export interface DiscoverMCPResponse {
  tools: DiscoveredTool[];
  requires_auth?: boolean;
  error?: string;
}

export interface DiscoveredTool {
  name: string;
  description: string;
  input_schema?: Record<string, unknown>;
}

export interface ToolPricing {
  name: string;
  price_usd: number;
}

export interface RegisterMCPRequest {
  name: string;
  endpoint: string;
  owner_address: string;
  description?: string;
  transport?: string;
  tags?: string[];
  payout_address?: string;
  currency?: string;
  upstream_headers?: Record<string, string>;
  tools?: ToolPricing[];
  discovered_tools?: DiscoveredTool[]; // Full tool info from discovery
  requires_config?: boolean;
  config_schema?: ConfigSchema;
  auth_configs?: RegisterAuthConfig[];
}

export interface RegisterMCPResponse {
  success: boolean;
  message: string;
  tool: MCP;
}

export interface UpdateMCPRequest {
  name?: string;
  description?: string;
  endpoint?: string;
  transport?: string;
  tags?: string[];
  payout_address?: string;
  currency?: string;
  status?: string;
  upstream_headers?: Record<string, string>;
}

export interface RefreshToolsResponse {
  success: boolean;
  num_tools: number;
  tools: { name: string; description: string; inputSchema: Record<string, unknown> }[];
}

// ============ Billing Types ============

export interface CallLog {
  id: string;
  gateway_type: string;
  service_id: string;
  tool_name: string;
  caller_address: string;
  owner_address: string;
  status: string;
  duration_ms?: number;
  error_message?: string;
  created_at: string;
}

export interface UsageResponse {
  calls: CallLog[];
  total: number;
}

export interface PaymentLog {
  id: string;
  tx_signature: string;
  payer_address: string;
  server_id: string;
  tool_name: string;
  token: string;
  amount_raw: number;
  amount_usd: number;
  owner_address: string;
  owner_share_usd: number;
  platform_share_usd: number;
  status: string;
  created_at: string;
}

export interface PaymentHistoryResponse {
  payments: PaymentLog[];
  total: number;
}

// ============ Credentials Types ============

export interface CredentialInfo {
  id: string;
  mcp_server_id: string;
  mcp_name?: string;
  token_name: string;
  created_at: string;
  last_used_at?: string;
  auto_refreshed?: boolean;
  num_tools?: number;
  auto_refresh_error?: string;
}

export interface CredentialsListResponse {
  credentials: CredentialInfo[];
}

export interface CreateCredentialRequest {
  mcp_server_id: string;
  token_name: string;
  token: string;
}

export type CreateCredentialResponse = CredentialInfo;

export interface UpdateCredentialRequest {
  token?: string;
  token_name?: string;
}

// ============ Agent Types ============

export interface Agent {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  provider_org?: string;
  provider_url?: string;
  version: string;
  input_modes: string[];
  output_modes: string[];
  streaming: boolean;
  tags: string[];
  owner_address: string;
  payout_address?: string;
  price_per_task: number;
  requires_config: boolean;
  config_schema?: ConfigSchema;
  status: string;
  num_skills: number;
  source: string;
  is_verified: boolean;
  icon_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AgentSkill {
  id: string;
  agent_id: string;
  skill_id: string;
  name: string;
  description: string;
  tags?: string[];
  examples?: string[];
  input_modes?: string[];
  output_modes?: string[];
  created_at: string;
}

export interface AgentListResponse {
  agents: Agent[];
  total: number;
}

export interface AgentDetailResponse {
  agent: Agent;
  skills: AgentSkill[];
}

export interface RegisterAgentRequest {
  endpoint: string;
  name?: string;
  description?: string;
  tags?: string[];
  payout_address?: string;
  price_per_task?: number;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  endpoint?: string;
  tags?: string[];
  payout_address?: string;
  price_per_task?: number;
  status?: string;
}
