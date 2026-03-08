"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gateway, type RegisterAgentRequest } from "@/lib/api";
import { useGatewayStore } from "@/lib/gateway-store";
import { useWallet } from "@solana/wallet-adapter-react";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";


export default function RegisterAgentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { publicKey } = useWallet();
  const { apiKey } = useGatewayStore();

  const [endpoint, setEndpoint] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [payoutAddress, setPayoutAddress] = useState("");
  const [pricePerTask, setPricePerTask] = useState(0);
  const [success, setSuccess] = useState(false);

  const registerMutation = useMutation({
    mutationFn: (req: RegisterAgentRequest) => gateway.registerAgent(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-agents"] });
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/agents");
      }, 1500);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const walletAddress = publicKey?.toBase58() || "";

    const req: RegisterAgentRequest = {
      endpoint,
      name: name.trim() || undefined,
      description: description.trim() || undefined,
      tags: tags.length ? tags : undefined,
      payout_address: payoutAddress.trim() || walletAddress || undefined,
      price_per_task: pricePerTask,
    };

    registerMutation.mutate(req);
  };

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => router.push("/dashboard/agents")}
        className="text-sm text-[#888] hover:text-white mb-4 block"
      >
        &larr; Back to Agents
      </button>

      <h1 className="text-2xl font-bold mb-6">Register Agent</h1>

      {!apiKey && (
        <Alert variant="warning" className="mb-6">
          Gateway not connected. Please reconnect your wallet or refresh the
          page.
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-6">
          Agent registered successfully! Redirecting...
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <Field label="Endpoint" required>
          <input
            type="url"
            required
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="https://agent.example.com"
            className="input"
          />
          <p className="text-xs text-[#666] mt-1">
            The agent card will be fetched automatically from this URL during
            registration.
          </p>
        </Field>

        <Field label="Name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Auto-detected from agent card"
            className="input"
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Auto-detected from agent card"
            rows={3}
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

        <Field label="Payout Address">
          <input
            type="text"
            value={payoutAddress}
            onChange={(e) => setPayoutAddress(e.target.value)}
            placeholder={publicKey?.toBase58() || "Solana wallet address"}
            className="input"
          />
          <p className="text-xs text-[#666] mt-1">
            Defaults to your connected wallet address if left empty.
          </p>
        </Field>

        <Field label="Price per Task (USD)">
          <input
            type="number"
            step="0.000001"
            min="0"
            value={pricePerTask || ""}
            onChange={(e) => setPricePerTask(parseFloat(e.target.value) || 0)}
            placeholder="0.001"
            className="input"
          />
        </Field>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={registerMutation.isPending || !endpoint.trim() || success}
            className="px-4 py-2 bg-[#d4af37] text-black font-medium rounded-lg hover:bg-[#c4a030] transition disabled:opacity-50"
          >
            {registerMutation.isPending ? "Registering..." : "Register Agent"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/agents")}
            className="px-4 py-2 border border-gray-700 text-[#888] rounded-lg hover:bg-gray-800 transition"
          >
            Cancel
          </button>
        </div>

        {registerMutation.error && (
          <Alert>
            {registerMutation.error instanceof Error
              ? registerMutation.error.message
              : "Failed to register agent"}
          </Alert>
        )}
      </form>
    </div>
  );
}

