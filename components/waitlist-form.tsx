"use client";

import { useState } from "react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) return;
    
    setStatus("loading");
    
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className="input flex-1"
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
