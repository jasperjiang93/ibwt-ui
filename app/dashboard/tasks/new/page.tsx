"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function NewTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    request: "",
    budgetIbwt: "",
    deadline: "",
    requirements: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const task = await api.createTask({
        request: form.request,
        budgetIbwt: parseInt(form.budgetIbwt),
        deadline: form.deadline || undefined,
        requirements: form.requirements ? JSON.parse(form.requirements) : undefined,
      });
      router.push(`/dashboard/tasks/${task.id}`);
    } catch (error) {
      console.error("Failed to create task:", error);
      alert("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Create New Task</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Task Description *
          </label>
          <textarea
            value={form.request}
            onChange={(e) => setForm({ ...form, request: e.target.value })}
            placeholder="Describe what you need done..."
            rows={4}
            required
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Budget ($IBWT) *
          </label>
          <input
            type="number"
            value={form.budgetIbwt}
            onChange={(e) => setForm({ ...form, budgetIbwt: e.target.value })}
            placeholder="1000"
            required
            min="1"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
          />
          <p className="text-gray-500 text-sm mt-1">
            Maximum amount you're willing to pay
          </p>
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Deadline (optional)
          </label>
          <input
            type="datetime-local"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Additional Requirements (JSON, optional)
          </label>
          <textarea
            value={form.requirements}
            onChange={(e) => setForm({ ...form, requirements: e.target.value })}
            placeholder='{"language": "en", "format": "markdown"}'
            rows={3}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none font-mono text-sm"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Task"}
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
