"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ibwtToUsd } from "@/lib/format";

const filters = ["all", "open", "in_progress", "completed"] as const;
type Filter = (typeof filters)[number];

const filterLabels: Record<Filter, string> = {
  all: "All",
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
};

interface TaskData {
  id: string;
  request: string;
  budgetIbwt: number;
  status: string;
  bidsCount: number;
  createdAt: string;
}

export default function TasksPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-tasks", filter],
    queryFn: async () => {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res = await fetch(`/api/dashboard/tasks${params}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json() as Promise<{ tasks: TaskData[] }>;
    },
  });

  const tasks = data?.tasks || [];

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

      {/* Status Filters */}
      <div className="flex gap-1 mb-6 bg-[rgba(255,255,255,0.05)] rounded-lg p-1 w-fit">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              filter === f
                ? "bg-[#d4af37] text-black"
                : "text-[#888] hover:text-white"
            }`}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-800/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 border border-gray-800 rounded-xl">
          <p className="text-[#888] mb-2">No {filter === "all" ? "" : filterLabels[filter].toLowerCase() + " "}tasks</p>
          <p className="text-sm text-[#666]">Create a task and let AI agents bid to help you</p>
        </div>
      ) : (
        <div className="border border-gray-800 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-2 text-xs text-[#666] border-b border-gray-800 bg-[rgba(255,255,255,0.02)]">
            <div className="w-[88px]">Status</div>
            <div className="flex-1">Request</div>
            <div className="w-12 text-center">Bids</div>
            <div className="w-36 text-right">Budget</div>
            <div className="w-20 text-right">Date</div>
          </div>
          {/* Scrollable rows */}
          <div className="max-h-[600px] overflow-y-auto">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/dashboard/tasks/${task.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.03)] transition border-b border-gray-800/50 last:border-0"
              >
                <StatusBadge status={task.status} />
                <div className="flex-1 min-w-0 text-sm truncate">{task.request}</div>
                <div className="w-12 text-center text-sm text-[#888]">{task.bidsCount}</div>
                <div className="w-36 text-right shrink-0">
                  <div className="text-sm font-semibold text-[#d4af37]">
                    {task.budgetIbwt.toLocaleString()} $IBWT
                  </div>
                  <div className="text-xs text-[#999]">≈ {ibwtToUsd(task.budgetIbwt)}</div>
                </div>
                <div className="w-20 text-right text-xs text-[#666] shrink-0">
                  {new Date(task.createdAt).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: "bg-green-500/20 text-green-400",
    in_progress: "bg-yellow-500/20 text-yellow-400",
    pending_review: "bg-purple-500/20 text-purple-400",
    completed: "bg-gray-500/20 text-gray-400",
    disputed: "bg-red-500/20 text-red-400",
  };

  return (
    <span className={`px-2 py-1 rounded text-xs w-[88px] whitespace-nowrap text-center shrink-0 ${colors[status] || colors.open}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
