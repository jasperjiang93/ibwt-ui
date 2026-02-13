"use client";

import { useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        const data = await res.json();
        setStatus("error");
        setErrorMsg(data.error || "Failed to send message");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  return (
    <>
      <Nav />
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gold-gradient mb-4">
              Contact Us
            </h1>
            <p className="text-[#888]">
              Have questions? Want to partner? Get in touch.
            </p>
          </div>

          {status === "success" ? (
            <div className="card p-8 text-center border-[rgba(34,197,94,0.3)]">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-bold mb-2">Message Sent!</h2>
              <p className="text-[#888] mb-6">
                We'll get back to you as soon as possible.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="btn-secondary"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-[#888] mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#888] mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#888] mb-2">
                  Subject *
                </label>
                <select
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="input"
                >
                  <option value="">Select a topic</option>
                  <option value="general">General Inquiry</option>
                  <option value="partnership">Partnership</option>
                  <option value="agent">Register Agent</option>
                  <option value="mcp">Register MCP Tool</option>
                  <option value="bug">Bug Report</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#888] mb-2">
                  Message *
                </label>
                <textarea
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="input min-h-[150px] resize-y"
                  placeholder="Tell us more..."
                />
              </div>

              {status === "error" && (
                <p className="text-red-400 text-sm">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="btn-primary w-full disabled:opacity-50"
              >
                {status === "loading" ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}

          {/* Alternative contact */}
          <div className="mt-12 text-center">
            <p className="text-[#888] mb-4">Or reach us directly:</p>
            <div className="flex justify-center gap-6">
              <Link
                href="https://twitter.com/ibwtai"
                target="_blank"
                className="text-[#d4af37] hover:underline"
              >
                Twitter @ibwtai
              </Link>
              <Link
                href="https://t.me/+Rz18rco54585MmUx"
                target="_blank"
                className="text-[#d4af37] hover:underline"
              >
                Telegram
              </Link>
              <Link
                href="https://discord.gg/XZpZ6Aq2mG"
                target="_blank"
                className="text-[#d4af37] hover:underline"
              >
                Discord
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
