const API_BASE =
  process.env.NEXT_PUBLIC_GATEWAY_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

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
    pricePerCall: number
  ) {
    return this.request<{ success: boolean; message: string }>(
      "PUT",
      `/api/v1/mcp/${mcpId}/tools/${toolName}/price`,
      { price_per_call: pricePerCall }
    );
  }

  // ============ Billing ============

  async getBalance() {
    return this.request<BalanceResponse>("GET", "/api/v1/billing/balance");
  }

  async getHistory(limit = 50, offset = 0) {
    return this.request<HistoryResponse>(
      "GET",
      `/api/v1/billing/history?limit=${limit}&offset=${offset}`
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

export interface MCP {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  mcp_endpoint: string;
  sse_endpoint: string;
  transport: string;
  tags: string[];
  num_tools: number;
  owner_address: string;
  payout_address: string;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
  is_healthy: boolean;
  last_check_at: string;
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
  price_per_call: number;
}

export interface DiscoverMCPRequest {
  endpoint: string;
  transport?: string;
  upstream_headers?: Record<string, string>;
}

export interface DiscoverMCPResponse {
  tools: DiscoveredTool[];
}

export interface DiscoveredTool {
  name: string;
  description: string;
  input_schema?: Record<string, unknown>;
}

export interface ToolPricing {
  name: string;
  price_per_call: number;
}

export interface RegisterMCPRequest {
  name: string;
  endpoint: string;
  owner_address: string;
  description?: string;
  mcp_endpoint?: string;
  sse_endpoint?: string;
  transport?: string;
  tags?: string[];
  payout_address?: string;
  currency?: string;
  upstream_headers?: Record<string, string>;
  tools?: ToolPricing[];
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
  mcp_endpoint?: string;
  sse_endpoint?: string;
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

export interface BalanceResponse {
  owner_address: string;
  credits: number;
}

export interface CallLog {
  id: string;
  gateway_type: string;
  service_id: string;
  tool_name: string;
  caller_address: string;
  owner_address: string;
  credits_charged: number;
  status: string;
  duration_ms?: number;
  error_message?: string;
  created_at: string;
}

export interface HistoryResponse {
  calls: CallLog[];
  total: number;
}
