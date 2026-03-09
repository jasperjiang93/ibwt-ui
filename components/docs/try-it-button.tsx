"use client";

import { useState } from "react";

const GATEWAY_URL = "https://gateway.inbotwetrust.com";

export function TryItButton({
  label,
  endpoint,
  method = "GET",
}: {
  label: string;
  endpoint: string;
  method?: "GET" | "POST";
}) {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (response) {
      setResponse(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${GATEWAY_URL}${endpoint}`, { method });
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={run}
        disabled={loading}
        className="px-4 py-2 text-sm font-medium rounded-lg border border-[rgba(212,175,55,0.4)] text-[#d4af37] hover:bg-[rgba(212,175,55,0.1)] transition disabled:opacity-50"
      >
        {loading ? "Loading..." : response ? "Hide Response" : label}
      </button>
      {error && (
        <div className="mt-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">
          {error}
        </div>
      )}
      {response && (
        <pre className="mt-3 px-4 py-3 bg-[rgba(255,255,255,0.03)] border border-gray-800 rounded-lg text-sm font-mono text-[#ccc] overflow-x-auto max-h-96 overflow-y-auto">
          {response}
        </pre>
      )}
    </div>
  );
}
