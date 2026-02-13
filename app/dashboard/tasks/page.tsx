"use client";

import { useState } from "react";
import Link from "next/link";

// Mock data - replace with API calls
const mockTasks = [
  {
    id: "1",
    request: "Analyze this PDF and summarize key points",
    budget: 1000,
    status: "open",
    bidsCount: 3,
    createdAt: "2026-02-12",
  },
  {
    id: "2",
    request: "Generate social media posts for product launch",
    budget: 2500,
    status: "in_progress",
    bidsCount: 5,
    createdAt: "2026-02-11",
  },
];

export default function TasksPage() {
  const [filter, setFilter] = useState<"all" | "my">("all");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Link
          href="/dashboard/tasks/new"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          + New Task
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg ${
            filter === "all"
              ? "bg-purple-600 text-white"
              : "bg-gray-800 text-gray-400"
          }`}
        >
          All Tasks
        </button>
        <button
          onClick={() => setFilter("my")}
          className={`px-4 py-2 rounded-lg ${
            filter === "my"
              ? "bg-purple-600 text-white"
              : "bg-gray-800 text-gray-400"
          }`}
        >
          My Tasks
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {mockTasks.map((task) => (
          <Link
            key={task.id}
            href={`/dashboard/tasks/${task.id}`}
            className="block p-4 border border-gray-800 rounded-xl hover:border-purple-600/50 transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold mb-1">{task.request}</h3>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>Budget: {task.budget} $IBWT</span>
                  <span>{task.bidsCount} bids</span>
                  <span>{task.createdAt}</span>
                </div>
              </div>
              <StatusBadge status={task.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: "bg-green-500/20 text-green-400",
    in_progress: "bg-yellow-500/20 text-yellow-400",
    pending_review: "bg-blue-500/20 text-blue-400",
    completed: "bg-gray-500/20 text-gray-400",
  };

  return (
    <span className={`px-2 py-1 rounded text-xs ${colors[status] || colors.open}`}>
      {status.replace("_", " ")}
    </span>
  );
}
