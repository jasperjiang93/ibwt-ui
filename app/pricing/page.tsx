"use client";

import Link from "next/link";
import { useState } from "react";
import { Nav } from "@/components/nav";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for getting started",
    features: [
      "25,000 free calls/month",
      "Access to all MCPs",
      "Community support",
    ],
    cta: "Get Started",
    href: "/dashboard",
    featured: false,
  },
  {
    name: "Pro",
    price: "$30",
    period: "/month",
    description: "For power users and teams",
    features: [
      "100,000 free calls/month",
      "$0.001 per call after",
      "Priority support",
      "Usage analytics",
    ],
    cta: "Upgrade to Pro",
    href: "/dashboard/billing",
    featured: true,
  },
  {
    name: "Pay-as-you-go",
    price: "$0.001",
    period: "/call",
    description: "Only pay for what you use",
    features: [
      "No monthly commitment",
      "Access to all MCPs",
      "Pay per call",
    ],
    cta: "Get Started",
    href: "/dashboard",
    featured: false,
  },
];

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white">
      <Nav />

      <div className="max-w-6xl mx-auto px-6 pt-32 pb-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-[#888] max-w-2xl mx-auto">
            Start free, scale as you grow. Only pay for what you use.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 ${
                plan.featured
                  ? "border-2 border-[#d4af37] bg-[rgba(212,175,55,0.05)]"
                  : "border border-gray-800"
              }`}
            >
              {plan.featured && (
                <div className="text-xs font-semibold text-[#d4af37] uppercase tracking-wider mb-4">
                  Most Popular
                </div>
              )}
              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
              <div className="mb-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-[#888]">{plan.period}</span>
              </div>
              <p className="text-[#888] mb-6">{plan.description}</p>
              
              <Link
                href={plan.href}
                className={`block text-center py-3 px-6 rounded-lg font-medium transition mb-8 ${
                  plan.featured
                    ? "bg-[#d4af37] text-black hover:bg-[#c4a030]"
                    : "border border-gray-700 text-white hover:bg-gray-800"
                }`}
              >
                {plan.cta}
              </Link>

              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckIcon />
                    <span className="text-[#ccc]">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Tool Pricing Note */}
        <div className="border border-gray-800 rounded-xl p-8 mb-20">
          <h2 className="text-xl font-bold mb-4">How Tool Pricing Works</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-[#d4af37] mb-2">Free MCPs</h3>
              <p className="text-[#888] text-sm">
                Some MCP providers offer their tools for free. These only consume your monthly call quota — no additional cost.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#d4af37] mb-2">Paid MCPs</h3>
              <p className="text-[#888] text-sm">
                Providers can set a price per tool call. This is charged separately on top of your plan. 90% goes to the provider, 10% platform fee.
              </p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-[rgba(255,255,255,0.03)] rounded-lg">
            <p className="text-sm text-[#888]">
              <strong className="text-white">Example:</strong> You're on the Free plan and call a tool priced at $0.001.
              <br />
              → 1 call deducted from your 25k quota
              <br />
              → $0.001 charged (90% to provider, 10% to platform)
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">FAQ</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">What happens when I exceed my quota?</h3>
              <p className="text-[#888] text-sm">
                On Free plan, you'll need to wait until next month or upgrade. On Pro, you'll be charged $0.001 per additional call.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Do unused calls roll over?</h3>
              <p className="text-[#888] text-sm">
                No, call quotas reset at the start of each billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How do I pay for tool calls?</h3>
              <p className="text-[#888] text-sm">
                Paid tools use x402 on-chain payments. You pay per call directly with SOL or IBWT tokens — no deposit needed.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I become a provider?</h3>
              <p className="text-[#888] text-sm">
                Yes! Register your MCP server and set prices for your tools. See our <Link href="/docs#provider" className="text-[#d4af37] hover:underline">documentation</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
