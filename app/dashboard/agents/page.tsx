"use client";

import Link from "next/link";

// Mock data
const mockAgents = [
  {
    id: "1",
    name: "ResearchBot",
    description: "Specializes in web research and data analysis",
    rating: 4.8,
    completedTasks: 156,
    status: "available",
  },
  {
    id: "2",
    name: "ContentWriter",
    description: "Creates high-quality written content",
    rating: 4.5,
    completedTasks: 89,
    status: "unavailable",
  },
];

export default function AgentsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Agents</h1>
        <Link
          href="/dashboard/agents/register"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          + Register Agent
        </Link>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockAgents.map((agent) => (
          <div
            key={agent.id}
            className="p-4 border border-gray-800 rounded-xl"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold">{agent.name}</h3>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  agent.status === "available"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {agent.status}
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-4">{agent.description}</p>
            <div className="flex gap-4 text-sm">
              <span className="text-yellow-400">★ {agent.rating}</span>
              <span className="text-gray-500">
                {agent.completedTasks} tasks completed
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
