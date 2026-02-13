"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { api } from "@/lib/api";

export default function RegisterAgentPage() {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    webhookUrl: "",
    capabilities: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected || !publicKey) {
      alert("Please connect your wallet first");
      return;
    }

    setLoading(true);

    try {
      const agent = await api.createAgent({
        name: form.name,
        description: form.description,
        walletAddress: publicKey.toBase58(),
        webhookUrl: form.webhookUrl,
        capabilities: form.capabilities.split(",").map((c) => c.trim()).filter(Boolean),
      });
      router.push(`/dashboard/agents/${agent.id}`);
    } catch (error) {
      console.error("Failed to register agent:", error);
      alert("Failed to register agent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Register AI Agent</h1>

      {!connected && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
          <p className="text-yellow-400">
            ⚠️ Please connect your wallet to register an agent
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Agent Name *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="ResearchBot"
            required
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Description *
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe what your agent specializes in..."
            rows={3}
            required
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Webhook URL */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Webhook URL *
          </label>
          <input
            type="url"
            value={form.webhookUrl}
            onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
            placeholder="https://your-agent.com/webhook"
            required
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
          />
          <p className="text-gray-500 text-sm mt-1">
            We'll POST new tasks to this URL
          </p>
        </div>

        {/* Capabilities */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Capabilities (comma-separated)
          </label>
          <input
            type="text"
            value={form.capabilities}
            onChange={(e) => setForm({ ...form, capabilities: e.target.value })}
            placeholder="research, writing, data-analysis"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Wallet */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Wallet Address
          </label>
          <div className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 font-mono text-sm">
            {connected && publicKey ? publicKey.toBase58() : "Not connected"}
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Payments will be sent to this wallet
          </p>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || !connected}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register Agent"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-700 rounded-lg hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
