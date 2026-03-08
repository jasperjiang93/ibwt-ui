"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  gateway,
  type Agent,
  type AgentSkill,
  type UpdateAgentRequest,
} from "@/lib/api";
import { useGatewayStore } from "@/lib/gateway-store";
import { formatPrice } from "@/lib/format";
import { Field } from "@/components/ui/field";
import { InfoRow } from "@/components/ui/info-row";
import { Alert } from "@/components/ui/alert";

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { apiKey } = useGatewayStore();
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() || "";
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["agent", id],
    queryFn: () => gateway.getAgent(id),
    enabled: !!apiKey && !!id,
  });

  const refreshMutation = useMutation({
    mutationFn: () => gateway.refreshAgentSkills(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent", id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => gateway.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-agents"] });
      router.push("/dashboard/agents");
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

  if (!data?.agent) {
    return (
      <div className="text-center py-16">
        <p className="text-[#888]">Agent not found</p>
      </div>
    );
  }

  const agent = data.agent;
  const skills: AgentSkill[] = data.skills || [];
  const isOwner = agent.owner_address === walletAddress;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push("/dashboard/agents")}
            className="text-sm text-[#888] hover:text-white mb-2 block"
          >
            &larr; Back to Agents
          </button>
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          <p className="text-[#888] mt-1">{agent.description}</p>
        </div>
        {isOwner && (
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
        )}
      </div>

      {/* Edit form */}
      {editing && isOwner && <EditForm agent={agent} onDone={() => setEditing(false)} />}

      {/* Details card */}
      {!editing && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow label="Endpoint" value={agent.endpoint} />
            <InfoRow label="Status" value={agent.status} />
            <InfoRow label="Provider" value={agent.provider_org || "—"} />
            <InfoRow label="Version" value={agent.version || "—"} />
            <InfoRow
              label="Input Modes"
              value={
                agent.input_modes?.length
                  ? agent.input_modes.join(", ")
                  : "—"
              }
            />
            <InfoRow
              label="Output Modes"
              value={
                agent.output_modes?.length
                  ? agent.output_modes.join(", ")
                  : "—"
              }
            />
            <InfoRow
              label="Streaming"
              value={agent.streaming ? "Yes" : "No"}
            />
            <InfoRow
              label="Price per Task"
              value={formatPrice(agent.price_per_task ?? 0)}
            />
            <InfoRow
              label="Tags"
              value={agent.tags?.length ? agent.tags.join(", ") : "—"}
            />
            <InfoRow label="Skills" value={String(agent.num_skills)} />
          </div>
        </div>
      )}

      {/* Skills */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Skills ({skills.length})
          </h2>
          {isOwner && (
            <button
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
              className="px-3 py-1.5 text-sm border border-[rgba(212,175,55,0.3)] text-[#d4af37] rounded-lg hover:bg-[rgba(212,175,55,0.1)] transition disabled:opacity-50"
            >
              {refreshMutation.isPending ? "Refreshing..." : "Refresh Skills"}
            </button>
          )}
        </div>

        {skills.length === 0 ? (
          <div className="text-[#888] text-center py-8">
            <p>No skills discovered yet</p>
            <p className="text-sm text-[#666]">
              Click &quot;Refresh Skills&quot; to discover available skills
              from this agent
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {skills.map((skill) => (
              <SkillRow key={skill.id} skill={skill} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SkillRow({ skill }: { skill: AgentSkill }) {
  return (
    <div className="border border-gray-800 rounded-lg p-4">
      <div className="min-w-0">
        <h3 className="font-medium text-[#d4af37]">{skill.name}</h3>
        <p className="text-sm text-[#888] mt-1">{skill.description}</p>
        {skill.tags && skill.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {skill.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-[rgba(212,175,55,0.1)] text-[#d4af37] border border-[rgba(212,175,55,0.2)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {skill.examples && skill.examples.length > 0 && (
          <details className="mt-2">
            <summary className="text-xs text-[#666] cursor-pointer hover:text-[#888]">
              Examples
            </summary>
            <ul className="mt-1 text-xs text-[#888] list-disc list-inside space-y-0.5">
              {skill.examples.map((ex, i) => (
                <li key={i}>{ex}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}

function EditForm({
  agent,
  onDone,
}: {
  agent: Agent;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<UpdateAgentRequest>({
    name: agent.name,
    description: agent.description,
    endpoint: agent.endpoint,
    tags: agent.tags,
    payout_address: agent.payout_address,
    price_per_task: agent.price_per_task,
    status: agent.status,
  });

  const mutation = useMutation({
    mutationFn: (data: UpdateAgentRequest) =>
      gateway.updateAgent(agent.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent", agent.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-agents"] });
      onDone();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <h2 className="text-lg font-semibold mb-2">Edit Agent</h2>

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
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
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
        <Field label="Price per Task (USD)">
          <input
            type="number"
            step="0.000001"
            min="0"
            value={form.price_per_task || ""}
            onChange={(e) => setForm({ ...form, price_per_task: parseFloat(e.target.value) || 0 })}
            placeholder="0.001"
            className="input"
          />
        </Field>

        <Field label="Status">
          <select
            value={form.status || "active"}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="input"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        <Alert>
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Failed to update"}
        </Alert>
      )}
    </form>
  );
}

