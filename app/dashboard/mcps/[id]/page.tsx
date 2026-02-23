"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gateway, type MCP, type MCPToolEntry, type UpdateMCPRequest } from "@/lib/api";
import { useGatewayStore } from "@/lib/gateway-store";

export default function MCPDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { apiKey } = useGatewayStore();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: mcp, isLoading } = useQuery({
    queryKey: ["mcp", id],
    queryFn: () => gateway.getMCP(id),
    enabled: !!apiKey && !!id,
  });

  const { data: toolsData, isLoading: toolsLoading } = useQuery({
    queryKey: ["mcp-tools", id],
    queryFn: () => gateway.getTools(id),
    enabled: !!apiKey && !!id,
  });

  const refreshMutation = useMutation({
    mutationFn: () => gateway.refreshTools(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp-tools", id] });
      queryClient.invalidateQueries({ queryKey: ["mcp", id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => gateway.deleteMCP(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-mcps"] });
      router.push("/dashboard/mcps");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-800 rounded w-1/3 animate-pulse" />
        <div className="h-4 bg-gray-800 rounded w-2/3 animate-pulse" />
        <div className="h-64 bg-gray-800 rounded animate-pulse" />
      </div>
    );
  }

  if (!mcp) {
    return (
      <div className="text-center py-16">
        <p className="text-[#888]">MCP not found</p>
      </div>
    );
  }

  const tools: MCPToolEntry[] = toolsData?.tools || [];

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push("/dashboard/mcps")}
            className="text-sm text-[#888] hover:text-white mb-2 block"
          >
            &larr; Back to MCPs
          </button>
          <h1 className="text-2xl font-bold">{mcp.name}</h1>
          <p className="text-[#888] mt-1">{mcp.description}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="px-3 py-1.5 text-sm border border-[rgba(212,175,55,0.3)] text-[#d4af37] rounded-lg hover:bg-[rgba(212,175,55,0.1)] transition"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
          {confirmDelete ? (
            <div className="flex gap-1">
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Confirm"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-sm border border-gray-700 text-[#888] rounded-lg hover:bg-gray-800 transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-3 py-1.5 text-sm border border-red-800 text-red-400 rounded-lg hover:bg-red-900/30 transition"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Edit form */}
      {editing && <EditForm mcp={mcp} onDone={() => setEditing(false)} />}

      {/* Info grid */}
      {!editing && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow label="Endpoint" value={mcp.endpoint} />
            <InfoRow label="Transport" value={mcp.transport} />
            <InfoRow label="Status" value={mcp.status} />
            <InfoRow label="Currency" value={mcp.currency || "credits"} />
            <InfoRow
              label="Tags"
              value={mcp.tags?.length ? mcp.tags.join(", ") : "—"}
            />
            <InfoRow label="Tools" value={String(mcp.num_tools)} />
            {mcp.mcp_endpoint && (
              <InfoRow label="MCP Endpoint" value={mcp.mcp_endpoint} />
            )}
            {mcp.sse_endpoint && (
              <InfoRow label="SSE Endpoint" value={mcp.sse_endpoint} />
            )}
          </div>
        </div>
      )}

      {/* Tools */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Discovered Tools ({tools.length})
          </h2>
          <button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="px-3 py-1.5 text-sm border border-[rgba(212,175,55,0.3)] text-[#d4af37] rounded-lg hover:bg-[rgba(212,175,55,0.1)] transition disabled:opacity-50"
          >
            {refreshMutation.isPending ? "Refreshing..." : "Refresh Tools"}
          </button>
        </div>

        {toolsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-800/50 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : tools.length === 0 ? (
          <div className="text-[#888] text-center py-8">
            <p>No tools discovered yet</p>
            <p className="text-sm text-[#666]">
              Click &quot;Refresh Tools&quot; to discover available tools from this MCP server
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tools.map((tool) => (
              <ToolRow key={tool.tool_name} mcpId={id} tool={tool} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolRow({ mcpId, tool }: { mcpId: string; tool: MCPToolEntry }) {
  const queryClient = useQueryClient();
  const [editingPrice, setEditingPrice] = useState(false);
  const [price, setPrice] = useState(tool.price_per_call ?? 0);

  const priceMutation = useMutation({
    mutationFn: (newPrice: number) =>
      gateway.updateToolPrice(mcpId, tool.tool_name, newPrice),
    onSuccess: () => {
      setEditingPrice(false);
      queryClient.invalidateQueries({ queryKey: ["mcp-tools", mcpId] });
    },
  });

  const handleSave = () => {
    priceMutation.mutate(price);
  };

  const handleCancel = () => {
    setPrice(tool.price_per_call ?? 0);
    setEditingPrice(false);
  };

  return (
    <div className="border border-gray-800 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-[#d4af37]">{tool.tool_name}</h3>
          <p className="text-sm text-[#888] mt-1">{tool.description}</p>
        </div>

        {/* Price display / edit */}
        <div className="flex items-center gap-2 shrink-0">
          {editingPrice ? (
            <>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="input w-20 text-right text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
              />
              <span className="text-xs text-[#666]">credits</span>
              <button
                onClick={handleSave}
                disabled={priceMutation.isPending}
                className="px-2 py-1 text-xs bg-[#d4af37] text-black rounded hover:bg-[#c4a030] transition disabled:opacity-50"
              >
                {priceMutation.isPending ? "..." : "Save"}
              </button>
              <button
                onClick={handleCancel}
                className="px-2 py-1 text-xs text-[#888] hover:text-white transition"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditingPrice(true)}
              className="text-sm text-[#ccc] hover:text-[#d4af37] transition flex items-center gap-1"
              title="Click to edit price"
            >
              <span>{tool.price_per_call ?? 0} credits</span>
              <span className="text-[#666] text-xs">edit</span>
            </button>
          )}
        </div>
      </div>

      {priceMutation.error && (
        <p className="text-red-400 text-xs mt-2">
          {priceMutation.error instanceof Error
            ? priceMutation.error.message
            : "Failed to update price"}
        </p>
      )}

      {tool.input_schema &&
        Object.keys(tool.input_schema).length > 0 && (
          <details className="mt-2">
            <summary className="text-xs text-[#666] cursor-pointer hover:text-[#888]">
              Input Schema
            </summary>
            <pre className="mt-1 text-xs text-[#666] bg-[rgba(0,0,0,0.3)] rounded p-2 overflow-x-auto">
              {JSON.stringify(tool.input_schema, null, 2)}
            </pre>
          </details>
        )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[#666] text-xs mb-0.5">{label}</div>
      <div className="text-[#ccc] break-all">{value}</div>
    </div>
  );
}

function EditForm({ mcp, onDone }: { mcp: MCP; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<UpdateMCPRequest>({
    name: mcp.name,
    description: mcp.description,
    endpoint: mcp.endpoint,
    transport: mcp.transport,
    tags: mcp.tags,
    payout_address: mcp.payout_address,
    currency: mcp.currency,
  });

  const mutation = useMutation({
    mutationFn: (data: UpdateMCPRequest) => gateway.updateMCP(mcp.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp", mcp.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-mcps"] });
      onDone();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <h2 className="text-lg font-semibold mb-2">Edit MCP</h2>

      <Field label="Name">
        <input
          type="text"
          value={form.name || ""}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input"
        />
      </Field>

      <Field label="Description">
        <textarea
          value={form.description || ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input"
          rows={3}
        />
      </Field>

      <Field label="Endpoint">
        <input
          type="text"
          value={form.endpoint || ""}
          onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
          className="input"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Transport">
          <select
            value={form.transport || "auto"}
            onChange={(e) => setForm({ ...form, transport: e.target.value })}
            className="input"
          >
            <option value="auto">Auto</option>
            <option value="sse">SSE</option>
            <option value="streamable-http">Streamable HTTP</option>
          </select>
        </Field>

        <Field label="Payout Address">
          <input
            type="text"
            value={form.payout_address || ""}
            onChange={(e) =>
              setForm({ ...form, payout_address: e.target.value })
            }
            className="input"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Currency">
          <input
            type="text"
            value={form.currency || ""}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className="input"
          />
        </Field>

        <Field label="Tags (comma-separated)">
          <input
            type="text"
            value={form.tags?.join(", ") || ""}
            onChange={(e) =>
              setForm({
                ...form,
                tags: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
            className="input"
          />
        </Field>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-4 py-2 bg-[#d4af37] text-black font-medium rounded-lg hover:bg-[#c4a030] transition disabled:opacity-50"
        >
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-2 border border-gray-700 text-[#888] rounded-lg hover:bg-gray-800 transition"
        >
          Cancel
        </button>
      </div>

      {mutation.error && (
        <p className="text-red-400 text-sm">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Failed to update"}
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm text-[#888] mb-1">{label}</label>
      {children}
    </div>
  );
}
