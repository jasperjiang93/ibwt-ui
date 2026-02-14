"use client";

import { useState } from "react";

const roles = [
  { value: "user", label: "User" },
  { value: "agent_provider", label: "Agent Provider" },
  { value: "mcp_provider", label: "MCP Provider" },
  { value: "other", label: "Other" },
] as const;

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!role) {
      setStatus("error");
      setMessage("Please select your role.");
      return;
    }
    if (!email.trim()) {
      setStatus("error");
      setMessage("Please enter your email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("You're on the list! We'll be in touch soon.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="card p-8 text-center border-[rgba(34,197,94,0.3)]">
        <div className="text-4xl mb-4">✅</div>
        <p className="text-[#22c55e] font-semibold">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-8">
      {/* Role selection */}
      <p className="text-[#888] text-sm text-center mb-3">I am a...</p>
      <div className="flex flex-wrap justify-center gap-2 mb-5">
        {roles.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => { setRole(r.value); if (status === "error") setStatus("idle"); }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition ${
              role === r.value
                ? "bg-[#d4af37] text-black"
                : "bg-[rgba(255,255,255,0.05)] text-[#888] hover:text-white"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
          placeholder="Enter your email"
          className={`input flex-1 ${status === "error" ? "!border-red-500/50" : ""}`}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-primary whitespace-nowrap disabled:opacity-50"
        >
          {status === "loading" ? "Joining..." : "Join Waitlist"}
        </button>
      </div>

      {status === "error" && (
        <p className="text-red-400 text-sm mt-4">{message}</p>
      )}

      <p className="text-[#666] text-xs mt-4">
        We'll only email you about IBWT updates. No spam.
      </p>
    </form>
  );
}
