const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

class APIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
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
      const error = await res.json().catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }

    return res.json();
  }

  // ============ MCP ============
  
  async listMCPs() {
    return this.request<{ mcps: MCP[] }>("GET", "/api/v1/mcp");
  }

  async getMCP(id: string) {
    return this.request<MCP>("GET", `/api/v1/mcp/${id}`);
  }

  async createMCP(data: CreateMCPInput) {
    return this.request<MCP>("POST", "/api/v1/mcp", data);
  }

  // ============ Agents ============
  
  async listAgents() {
    return this.request<{ agents: Agent[] }>("GET", "/api/v1/agents");
  }

  async getAgent(id: string) {
    return this.request<Agent>("GET", `/api/v1/agents/${id}`);
  }

  async createAgent(data: CreateAgentInput) {
    return this.request<Agent>("POST", "/api/v1/agents", data);
  }

  async updateAgentStatus(id: string, status: "available" | "unavailable") {
    return this.request<Agent>("POST", `/api/v1/agents/${id}/status`, { status });
  }

  // ============ Tasks ============
  
  async listTasks(filters?: TaskFilters) {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.userId) params.set("user_id", filters.userId);
    const query = params.toString() ? `?${params}` : "";
    return this.request<{ tasks: Task[] }>("GET", `/api/v1/tasks${query}`);
  }

  async getTask(id: string) {
    return this.request<Task>("GET", `/api/v1/tasks/${id}`);
  }

  async createTask(data: CreateTaskInput) {
    return this.request<Task>("POST", "/api/v1/tasks", data);
  }

  async getTaskBids(taskId: string) {
    return this.request<{ bids: Bid[] }>("GET", `/api/v1/tasks/${taskId}/bids`);
  }

  // ============ Bids ============
  
  async acceptBid(bidId: string) {
    return this.request<Bid>("POST", `/api/v1/bids/${bidId}/accept`);
  }

  async rejectBid(bidId: string) {
    return this.request<Bid>("POST", `/api/v1/bids/${bidId}/reject`);
  }

  // ============ Payments ============
  
  async preparePayment(taskId: string) {
    return this.request<{ transaction: string }>("POST", `/api/v1/tasks/${taskId}/pay`);
  }

  async confirmPayment(taskId: string, txId: string) {
    return this.request<Task>("POST", `/api/v1/tasks/${taskId}/confirm-payment`, { txId });
  }

  // ============ Results ============
  
  async approveResult(taskId: string) {
    return this.request<Task>("POST", `/api/v1/tasks/${taskId}/approve`);
  }

  async requestRevision(taskId: string, feedback: string) {
    return this.request<Task>("POST", `/api/v1/tasks/${taskId}/revision`, { feedback });
  }

  async disputeTask(taskId: string, reason: string) {
    return this.request<Task>("POST", `/api/v1/tasks/${taskId}/dispute`, { reason });
  }
}

export const api = new APIClient(API_BASE);

// ============ Types ============

export interface MCP {
  id: string;
  name: string;
  description: string;
  providerAddress: string;
  endpoint: string;
  pricePerCall: number;
  status: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  walletAddress: string;
  capabilities: string[];
  status: string;
  rating: number;
  completedTasks: number;
}

export interface Task {
  id: string;
  userId: string;
  request: string;
  requirements: Record<string, unknown>;
  budgetIbwt: number;
  deadline: string | null;
  status: string;
  acceptedBidId: string | null;
  createdAt: string;
}

export interface Bid {
  id: string;
  taskId: string;
  agentId: string;
  agentAddress: string;
  agent_fee: number;
  mcp_plan: MCPQuota[];
  total: number;
  eta_minutes: number;
  message: string;
  status: string;
  created_at: string;
  agent?: Agent;
}

export interface MCPQuota {
  mcp_id: string;
  mcp_name: string;
  calls: number;
  price_per_call: number;
  subtotal: number;
}

export interface TaskResult {
  id: string;
  task_id: string;
  outputs: ResultOutput[];
  revision_count: number;
  submitted_at: string;
}

export interface ResultOutput {
  type: "text" | "image" | "file" | "audio" | "video";
  label: string;
  content?: string;
  url?: string;
  filename?: string;
  size?: number;
  duration?: number;
  mime_type?: string;
}

export interface CreateMCPInput {
  name: string;
  description: string;
  endpoint: string;
  pricePerCall: number;
}

export interface CreateAgentInput {
  name: string;
  description: string;
  walletAddress: string;
  webhookUrl: string;
  capabilities: string[];
}

export interface CreateTaskInput {
  request: string;
  requirements?: Record<string, unknown>;
  budgetIbwt: number;
  deadline?: string;
}

export interface TaskFilters {
  status?: string;
  userId?: string;
}
