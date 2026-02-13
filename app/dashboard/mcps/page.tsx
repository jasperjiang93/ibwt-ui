"use client";

import Link from "next/link";

// Mock data
const mockMCPs = [
  {
    id: "1",
    name: "PDF Reader",
    description: "Extract text and images from PDF files",
    pricePerCall: 50,
    status: "active",
  },
  {
    id: "2",
    name: "Web Scraper",
    description: "Scrape and parse web pages",
    pricePerCall: 100,
    status: "active",
  },
  {
    id: "3",
    name: "Image Generator",
    description: "Generate images using AI models",
    pricePerCall: 500,
    status: "active",
  },
];

export default function MCPsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">MCP Tools</h1>
        <Link
          href="/mcps"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Browse Tools
        </Link>
      </div>

      {/* MCP Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockMCPs.map((mcp) => (
          <div
            key={mcp.id}
            className="p-4 border border-gray-800 rounded-xl hover:border-purple-600/50 transition cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold">{mcp.name}</h3>
              <span className="text-purple-400 text-sm">
                {mcp.pricePerCall} $IBWT/call
              </span>
            </div>
            <p className="text-gray-500 text-sm">{mcp.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
