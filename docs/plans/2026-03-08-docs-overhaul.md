# Docs & Developer Page Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite all documentation pages and the dashboard Developer page to be user-journey-oriented, with interactive elements, real gateway URLs, and one-click integration configs for Claude Code / Cursor / Windsurf.

**Architecture:** Next.js 15 App Router pages under `/app/docs/`. New reusable components (`TabGroup`, `TryItButton`) in `/components/docs/`. All pages are React Server Components except interactive ones marked `"use client"`. Gateway URL is `https://gateway.inbotwetrust.com`. Design system: dark theme, gold accent (#d4af37), Space Grotesk font, Tailwind v4.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Zustand (for API key in dashboard)

---

## Task 1: Create TabGroup Component

**Files:**
- Create: `components/docs/tab-group.tsx`

**Step 1: Create the component**

```tsx
"use client";

import { useState, useEffect } from "react";

interface Tab {
  label: string;
  content: React.ReactNode;
}

export function TabGroup({
  tabs,
  storageKey,
}: {
  tabs: Tab[];
  storageKey?: string;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!storageKey) return;
    const saved = localStorage.getItem(`ibwt-tab-${storageKey}`);
    if (saved !== null) {
      const idx = parseInt(saved, 10);
      if (idx >= 0 && idx < tabs.length) setActive(idx);
    }
  }, [storageKey, tabs.length]);

  const select = (idx: number) => {
    setActive(idx);
    if (storageKey) localStorage.setItem(`ibwt-tab-${storageKey}`, String(idx));
  };

  return (
    <div>
      <div className="flex gap-1 border-b border-gray-800 mb-4">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => select(i)}
            className={`px-4 py-2 text-sm font-medium transition rounded-t-lg ${
              active === i
                ? "text-[#d4af37] border-b-2 border-[#d4af37] bg-[rgba(212,175,55,0.08)]"
                : "text-[#888] hover:text-[#ccc] hover:bg-[rgba(255,255,255,0.03)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[active]?.content}</div>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/jasper/Documents/clawd/projects/ibwt/ibwt-ui && pnpm build 2>&1 | tail -5`
Expected: Build succeeds (component is not imported yet, but should compile)

**Step 3: Commit**

```bash
git add components/docs/tab-group.tsx
git commit -m "feat(docs): add TabGroup component with localStorage persistence"
```

---

## Task 2: Create TryItButton Component

**Files:**
- Create: `components/docs/try-it-button.tsx`

**Step 1: Create the component**

This component calls public gateway APIs and displays the real JSON response inline.

```tsx
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
```

**Step 2: Verify build**

Run: `cd /Users/jasper/Documents/clawd/projects/ibwt/ibwt-ui && pnpm build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/docs/try-it-button.tsx
git commit -m "feat(docs): add TryItButton component for live API demos"
```

---

## Task 3: Update Docs Layout (New Sidebar Navigation)

**Files:**
- Modify: `app/docs/layout.tsx`

**Step 1: Rewrite the layout**

Replace the entire `navSections` array and keep the same layout structure. New navigation:

```tsx
const navSections = [
  {
    items: [
      { href: "/docs", label: "Overview" },
      { href: "/docs/quickstart", label: "Quick Start" },
    ],
  },
  {
    title: "Integrate",
    items: [
      { href: "/docs/claude-code", label: "Claude Code" },
      { href: "/docs/cursor-windsurf", label: "Cursor & Windsurf" },
      { href: "/docs/api-client", label: "API / Custom Client" },
    ],
  },
  {
    title: "Concepts",
    items: [
      { href: "/docs/mcp-gateway", label: "MCP Gateway" },
      { href: "/docs/agents", label: "AI Agents (A2A)" },
      { href: "/docs/credentials", label: "Credentials" },
      { href: "/docs/payments", label: "Payments (x402)" },
    ],
  },
  {
    title: "Build",
    items: [
      { href: "/docs/providers", label: "Provider Guide" },
      { href: "/docs/sdks", label: "SDKs" },
    ],
  },
];
```

**Step 2: Delete old pages that are being replaced/renamed**

Remove these files (their content will be rewritten at new paths):
- `app/docs/mcps/page.tsx` → replaced by `app/docs/mcp-gateway/page.tsx`
- `app/docs/api/page.tsx` → removed (API Reference deferred)

**Step 3: Verify build**

Run: `cd /Users/jasper/Documents/clawd/projects/ibwt/ibwt-ui && pnpm build 2>&1 | tail -10`
Expected: Build succeeds (some links may 404 until pages are created — that's fine)

**Step 4: Commit**

```bash
git add -A app/docs/
git commit -m "feat(docs): restructure sidebar navigation for user-journey flow"
```

---

## Task 4: Rewrite Overview Page

**Files:**
- Modify: `app/docs/page.tsx`

**Step 1: Rewrite the page**

The overview must answer "what is this?" in 10 seconds. Lead with the value proposition, show three feature cards, and include a TryIt button that fetches real server data.

```tsx
import Link from "next/link";
import { TryItButton } from "@/components/docs/try-it-button";

export default function DocsOverviewPage() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">IBWT Gateway</h1>
      <p className="text-[#ccc] text-xl mb-8 leading-relaxed">
        One endpoint to access a growing marketplace of MCP tools and AI agents.
        Configure once, use everything.
      </p>
      <p className="text-[#888] text-lg mb-12">
        IBWT is a unified gateway that aggregates MCP servers and AI agents
        behind a single API. Connect your AI tool — Claude Code, Cursor,
        Windsurf — and your AI autonomously discovers, subscribes to, and calls
        any tool it needs. No manual configuration per service.
      </p>

      {/* Value prop cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-16">
        <div className="border border-gray-800 rounded-xl p-6 hover:border-[rgba(212,175,55,0.3)] transition">
          <h3 className="font-semibold mb-2">One Endpoint, All Tools</h3>
          <p className="text-sm text-[#888]">
            MCP reverse proxy aggregating a growing marketplace of servers —
            GitHub, Stripe, Vercel, Supabase, and more. Your AI picks what it
            needs.
          </p>
        </div>
        <div className="border border-gray-800 rounded-xl p-6 hover:border-[rgba(212,175,55,0.3)] transition">
          <h3 className="font-semibold mb-2">AI Agent Marketplace</h3>
          <p className="text-sm text-[#888]">
            Discover and call AI agents via the A2A (Agent-to-Agent) protocol.
            Send tasks, stream responses, let agents collaborate.
          </p>
        </div>
        <div className="border border-gray-800 rounded-xl p-6 hover:border-[rgba(212,175,55,0.3)] transition">
          <h3 className="font-semibold mb-2">Pay Per Use</h3>
          <p className="text-sm text-[#888]">
            x402 on-chain payments on Solana. Pay only for what you use —
            per tool call or per agent task. No subscriptions, no minimums.
          </p>
        </div>
      </div>

      {/* Try it */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-4">See What&apos;s Available</h2>
        <p className="text-[#888] mb-4">
          Hit the gateway right now to see the live marketplace:
        </p>
        <TryItButton
          label="Try it — List all MCP servers"
          endpoint="/api/v1/mcp/list"
        />
      </div>

      {/* Next steps */}
      <div className="border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Get Started</h2>
        <div className="space-y-3">
          <Link
            href="/docs/quickstart"
            className="block text-[#d4af37] hover:underline"
          >
            Quick Start — from zero to your first tool call
          </Link>
          <Link
            href="/docs/claude-code"
            className="block text-[#d4af37] hover:underline"
          >
            Claude Code — one command to connect
          </Link>
          <Link
            href="/docs/cursor-windsurf"
            className="block text-[#d4af37] hover:underline"
          >
            Cursor & Windsurf — JSON config
          </Link>
        </div>
      </div>
    </>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/jasper/Documents/clawd/projects/ibwt/ibwt-ui && pnpm build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add app/docs/page.tsx
git commit -m "feat(docs): rewrite overview page with value props and live TryIt demo"
```

---

## Task 5: Rewrite Quick Start Page

**Files:**
- Modify: `app/docs/quickstart/page.tsx`

**Step 1: Rewrite the page**

3 steps. Lead with tool integration (Claude Code / Cursor), not curl. Use TabGroup for tool selection.

```tsx
import Link from "next/link";
import { CodeBlock } from "@/components/docs/code-block";
import { DocSection } from "@/components/docs/doc-section";
import { TabGroup } from "@/components/docs/tab-group";

export default function QuickStartPage() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">Quick Start</h1>
      <p className="text-[#888] text-lg mb-12">
        From zero to your first tool call in under 2 minutes.
      </p>

      <DocSection title="1. Connect Your Wallet">
        <p className="text-[#888] mb-4">
          Go to the{" "}
          <Link href="/dashboard" className="text-[#d4af37] hover:underline">
            Dashboard
          </Link>
          , connect your Solana wallet, and an API key is generated
          automatically. Copy it from the{" "}
          <Link
            href="/dashboard/developer"
            className="text-[#d4af37] hover:underline"
          >
            Developer
          </Link>{" "}
          page.
        </p>
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-300">
          IBWT is on <strong>Solana Devnet</strong> during beta. Get free
          devnet SOL from{" "}
          <a
            href="https://faucet.solana.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-yellow-200"
          >
            faucet.solana.com
          </a>
          .
        </div>
      </DocSection>

      <DocSection title="2. Add to Your AI Tool">
        <p className="text-[#888] mb-6">
          Point your AI tool at the IBWT gateway. Replace{" "}
          <code className="text-[#ccc]">YOUR_API_KEY</code> with the key from
          step 1.
        </p>
        <TabGroup
          storageKey="quickstart-tool"
          tabs={[
            {
              label: "Claude Code",
              content: (
                <div>
                  <p className="text-[#888] mb-3">
                    Run this in your terminal:
                  </p>
                  <CodeBlock>{`claude mcp add ibwt-gateway \\
  --transport http \\
  -h "Authorization: Bearer YOUR_API_KEY" \\
  https://gateway.inbotwetrust.com/api/v1/mcp/gateway`}</CodeBlock>
                  <p className="text-[#888] mt-3 text-sm">
                    Then restart Claude Code. See the{" "}
                    <Link
                      href="/docs/claude-code"
                      className="text-[#d4af37] hover:underline"
                    >
                      full Claude Code guide
                    </Link>{" "}
                    for details.
                  </p>
                </div>
              ),
            },
            {
              label: "Cursor",
              content: (
                <div>
                  <p className="text-[#888] mb-3">
                    Add to <code className="text-[#ccc]">.cursor/mcp.json</code>{" "}
                    in your project root:
                  </p>
                  <CodeBlock>{`{
  "mcpServers": {
    "ibwt-gateway": {
      "url": "https://gateway.inbotwetrust.com/api/v1/mcp/gateway",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}`}</CodeBlock>
                  <p className="text-[#888] mt-3 text-sm">
                    Restart Cursor after saving. See the{" "}
                    <Link
                      href="/docs/cursor-windsurf"
                      className="text-[#d4af37] hover:underline"
                    >
                      full Cursor & Windsurf guide
                    </Link>
                    .
                  </p>
                </div>
              ),
            },
            {
              label: "Windsurf",
              content: (
                <div>
                  <p className="text-[#888] mb-3">
                    Add to your Windsurf MCP configuration:
                  </p>
                  <CodeBlock>{`{
  "mcpServers": {
    "ibwt-gateway": {
      "serverUrl": "https://gateway.inbotwetrust.com/api/v1/mcp/gateway",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}`}</CodeBlock>
                </div>
              ),
            },
            {
              label: "curl",
              content: (
                <div>
                  <p className="text-[#888] mb-3">
                    Test the gateway directly:
                  </p>
                  <CodeBlock>{`curl -X POST https://gateway.inbotwetrust.com/api/v1/mcp/gateway \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'`}</CodeBlock>
                </div>
              ),
            },
          ]}
        />
      </DocSection>

      <DocSection title="3. Start Using">
        <p className="text-[#888] mb-4">
          That&apos;s it. Your AI tool now has access to the full IBWT
          marketplace. The AI will automatically:
        </p>
        <ul className="list-disc list-inside text-[#888] space-y-2 mb-6">
          <li>
            <strong className="text-[#ccc]">Discover</strong> available MCP
            servers via built-in gateway tools
          </li>
          <li>
            <strong className="text-[#ccc]">Subscribe</strong> to servers it
            needs for your task
          </li>
          <li>
            <strong className="text-[#ccc]">Call tools</strong> on those
            servers — all through the single gateway endpoint
          </li>
        </ul>
        <p className="text-[#888] mb-4">
          For MCP servers that require API keys (GitHub, Stripe, etc.), store
          your credentials in the{" "}
          <Link
            href="/dashboard/secrets"
            className="text-[#d4af37] hover:underline"
          >
            Secrets
          </Link>{" "}
          page or via the{" "}
          <Link
            href="/docs/credentials"
            className="text-[#d4af37] hover:underline"
          >
            Credentials API
          </Link>
          . The gateway injects them automatically on every call.
        </p>
      </DocSection>
    </>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/jasper/Documents/clawd/projects/ibwt/ibwt-ui && pnpm build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add app/docs/quickstart/page.tsx
git commit -m "feat(docs): rewrite quick start with tool-first integration flow"
```

---

## Task 6: Create Claude Code Integration Page

**Files:**
- Create: `app/docs/claude-code/page.tsx`

**Step 1: Create the page**

End-to-end guide specific to Claude Code users.

```tsx
import { CodeBlock } from "@/components/docs/code-block";
import { DocSection } from "@/components/docs/doc-section";
import Link from "next/link";

export default function ClaudeCodePage() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">Claude Code</h1>
      <p className="text-[#888] text-lg mb-12">
        Connect IBWT Gateway to Claude Code and access the full MCP marketplace
        from your terminal.
      </p>

      <DocSection title="1. Add the Gateway">
        <p className="text-[#888] mb-4">
          Run this command in your terminal. Replace{" "}
          <code className="text-[#ccc]">YOUR_API_KEY</code> with your key from
          the{" "}
          <Link
            href="/dashboard/developer"
            className="text-[#d4af37] hover:underline"
          >
            Developer dashboard
          </Link>
          .
        </p>
        <CodeBlock title="Terminal">{`claude mcp add ibwt-gateway \\
  --transport http \\
  -h "Authorization: Bearer YOUR_API_KEY" \\
  https://gateway.inbotwetrust.com/api/v1/mcp/gateway`}</CodeBlock>
      </DocSection>

      <DocSection title="2. Restart Claude Code">
        <p className="text-[#888] mb-4">
          Start a new Claude Code session. On startup, Claude discovers the
          gateway&apos;s built-in tools:
        </p>
        <ul className="list-disc list-inside text-[#888] space-y-2">
          <li>
            <code className="text-[#ccc]">gateway__find_servers</code> — search
            for MCP servers by keyword
          </li>
          <li>
            <code className="text-[#ccc]">gateway__list_servers</code> — browse
            all available servers
          </li>
          <li>
            <code className="text-[#ccc]">gateway__subscribe</code> — activate
            a server to use its tools
          </li>
          <li>
            <code className="text-[#ccc]">gateway__unsubscribe</code> —
            deactivate a server
          </li>
          <li>
            <code className="text-[#ccc]">gateway__list_subscriptions</code> —
            see your active servers
          </li>
        </ul>
      </DocSection>

      <DocSection title="3. Just Ask">
        <p className="text-[#888] mb-4">
          You don&apos;t need to manually subscribe to anything. Just ask Claude
          what you need — it handles discovery and subscription automatically.
        </p>
        <div className="border border-gray-800 rounded-xl overflow-hidden mb-6">
          <div className="px-4 py-2 bg-[rgba(255,255,255,0.03)] border-b border-gray-800 text-xs text-[#888]">
            Example conversation
          </div>
          <div className="p-4 space-y-4 text-sm">
            <div>
              <p className="text-[#d4af37] font-medium mb-1">You:</p>
              <p className="text-[#ccc]">
                Search for MCP servers related to &quot;database&quot;
              </p>
            </div>
            <div>
              <p className="text-blue-400 font-medium mb-1">Claude:</p>
              <p className="text-[#888]">
                I&apos;ll search the IBWT marketplace for database-related
                servers.
              </p>
              <div className="mt-2 px-3 py-2 bg-[rgba(255,255,255,0.02)] rounded text-xs font-mono text-[#666]">
                → gateway__find_servers({`{"query": "database"}`})
                <br />
                Found: Supabase, Neon, Prisma Postgres
              </div>
            </div>
            <div>
              <p className="text-[#d4af37] font-medium mb-1">You:</p>
              <p className="text-[#ccc]">
                Subscribe to Neon and list my databases
              </p>
            </div>
            <div>
              <p className="text-blue-400 font-medium mb-1">Claude:</p>
              <p className="text-[#888]">
                I&apos;ll subscribe to Neon and then list your databases.
              </p>
              <div className="mt-2 px-3 py-2 bg-[rgba(255,255,255,0.02)] rounded text-xs font-mono text-[#666]">
                → gateway__subscribe({`{"server_id": "..."}`})
                <br />→ Neon__list_projects()
              </div>
            </div>
          </div>
        </div>
      </DocSection>

      <DocSection title="4. Auth-Required Services">
        <p className="text-[#888] mb-4">
          Some MCP servers need API keys (e.g., GitHub, Stripe, Neon). Store
          your credentials once and the gateway injects them automatically on
          every call.
        </p>
        <p className="text-[#888] mb-4">
          Two ways to store credentials:
        </p>
        <ul className="list-disc list-inside text-[#888] space-y-2 mb-4">
          <li>
            <Link
              href="/dashboard/secrets"
              className="text-[#d4af37] hover:underline"
            >
              Dashboard → Secrets
            </Link>{" "}
            — UI for managing credentials
          </li>
          <li>
            <Link
              href="/docs/credentials"
              className="text-[#d4af37] hover:underline"
            >
              Credentials API
            </Link>{" "}
            — programmatic access
          </li>
        </ul>
      </DocSection>

      <DocSection title="Remove the Gateway">
        <p className="text-[#888] mb-4">To disconnect:</p>
        <CodeBlock>{`claude mcp remove ibwt-gateway`}</CodeBlock>
      </DocSection>
    </>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/jasper/Documents/clawd/projects/ibwt/ibwt-ui && pnpm build 2>&1 | tail -5`

**Step 3: Commit**

```bash
git add app/docs/claude-code/page.tsx
git commit -m "feat(docs): add Claude Code integration guide"
```

---

## Task 7: Create Cursor & Windsurf Integration Page

**Files:**
- Create: `app/docs/cursor-windsurf/page.tsx`

**Step 1: Create the page**

```tsx
import { CodeBlock } from "@/components/docs/code-block";
import { DocSection } from "@/components/docs/doc-section";
import { TabGroup } from "@/components/docs/tab-group";
import Link from "next/link";

export default function CursorWindsurfPage() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">Cursor & Windsurf</h1>
      <p className="text-[#888] text-lg mb-12">
        Add the IBWT gateway to Cursor or Windsurf with a JSON config file.
      </p>

      <DocSection title="1. Get Your API Key">
        <p className="text-[#888] mb-4">
          Connect your wallet at the{" "}
          <Link href="/dashboard" className="text-[#d4af37] hover:underline">
            Dashboard
          </Link>{" "}
          and copy your API key from the{" "}
          <Link
            href="/dashboard/developer"
            className="text-[#d4af37] hover:underline"
          >
            Developer
          </Link>{" "}
          page.
        </p>
      </DocSection>

      <DocSection title="2. Add the Config">
        <TabGroup
          storageKey="cursor-windsurf-tool"
          tabs={[
            {
              label: "Cursor",
              content: (
                <div>
                  <p className="text-[#888] mb-3">
                    Create or edit{" "}
                    <code className="text-[#ccc]">.cursor/mcp.json</code> in
                    your project root:
                  </p>
                  <CodeBlock title=".cursor/mcp.json">{`{
  "mcpServers": {
    "ibwt-gateway": {
      "url": "https://gateway.inbotwetrust.com/api/v1/mcp/gateway",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}`}</CodeBlock>
                  <p className="text-[#888] mt-4 text-sm">
                    For global access across all projects, use{" "}
                    <code className="text-[#ccc]">~/.cursor/mcp.json</code>{" "}
                    instead.
                  </p>
                </div>
              ),
            },
            {
              label: "Windsurf",
              content: (
                <div>
                  <p className="text-[#888] mb-3">
                    Add to your Windsurf MCP configuration file:
                  </p>
                  <CodeBlock title="mcp_config.json">{`{
  "mcpServers": {
    "ibwt-gateway": {
      "serverUrl": "https://gateway.inbotwetrust.com/api/v1/mcp/gateway",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}`}</CodeBlock>
                </div>
              ),
            },
          ]}
        />
      </DocSection>

      <DocSection title="3. Restart & Use">
        <p className="text-[#888] mb-4">
          Restart your editor. The AI agent will discover the IBWT gateway tools
          automatically and can search for, subscribe to, and call any MCP
          server in the marketplace.
        </p>
        <p className="text-[#888]">
          For services that need API keys, store credentials via the{" "}
          <Link
            href="/dashboard/secrets"
            className="text-[#d4af37] hover:underline"
          >
            Secrets dashboard
          </Link>
          .
        </p>
      </DocSection>
    </>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/jasper/Documents/clawd/projects/ibwt/ibwt-ui && pnpm build 2>&1 | tail -5`

**Step 3: Commit**

```bash
git add app/docs/cursor-windsurf/page.tsx
git commit -m "feat(docs): add Cursor & Windsurf integration guide"
```

---

## Task 8: Create API / Custom Client Page

**Files:**
- Create: `app/docs/api-client/page.tsx`

**Step 1: Create the page**

For developers building custom integrations. Covers MCP JSON-RPC and A2A. Uses TabGroup for curl vs language examples.

```tsx
import { CodeBlock } from "@/components/docs/code-block";
import { DocSection } from "@/components/docs/doc-section";
import { TabGroup } from "@/components/docs/tab-group";
import Link from "next/link";

export default function ApiClientPage() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">API / Custom Client</h1>
      <p className="text-[#888] text-lg mb-12">
        Integrate the IBWT gateway directly into your application using the MCP
        protocol (JSON-RPC) or REST API.
      </p>

      <DocSection title="Gateway Endpoint">
        <p className="text-[#888] mb-4">
          All MCP protocol requests go to a single endpoint:
        </p>
        <CodeBlock>https://gateway.inbotwetrust.com/api/v1/mcp/gateway</CodeBlock>
        <p className="text-[#888] mt-4">
          Authenticate with your API key in the{" "}
          <code className="text-[#ccc]">Authorization</code> header:
        </p>
        <CodeBlock>Authorization: Bearer YOUR_API_KEY</CodeBlock>
      </DocSection>

      <DocSection title="Initialize Session">
        <p className="text-[#888] mb-4">
          Start an MCP session. The response includes a{" "}
          <code className="text-[#ccc]">Mcp-Session-Id</code> header you can
          use for subsequent requests.
        </p>
        <CodeBlock title="POST /api/v1/mcp/gateway">{`curl -X POST https://gateway.inbotwetrust.com/api/v1/mcp/gateway \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "id": 1
  }'`}</CodeBlock>
      </DocSection>

      <DocSection title="List Available Tools">
        <p className="text-[#888] mb-4">
          After initializing, list all tools available to you. This includes
          the gateway&apos;s built-in discovery tools plus tools from any servers
          you&apos;ve subscribed to.
        </p>
        <CodeBlock title="POST /api/v1/mcp/gateway">{`curl -X POST https://gateway.inbotwetrust.com/api/v1/mcp/gateway \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"tools/list","id":2}'`}</CodeBlock>
        <p className="text-[#888] mt-4 text-sm">
          Tool names are prefixed with the server name:{" "}
          <code className="text-[#ccc]">ServerName__tool_name</code> (e.g.,{" "}
          <code className="text-[#ccc]">Vercel__list_projects</code>).
        </p>
      </DocSection>

      <DocSection title="Call a Tool">
        <p className="text-[#888] mb-4">
          Call any tool by its qualified name:
        </p>
        <CodeBlock title="POST /api/v1/mcp/gateway">{`curl -X POST https://gateway.inbotwetrust.com/api/v1/mcp/gateway \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "gateway__find_servers",
      "arguments": { "query": "database" }
    },
    "id": 3
  }'`}</CodeBlock>
      </DocSection>

      <DocSection title="A2A — Call an Agent">
        <p className="text-[#888] mb-4">
          Send tasks to AI agents using the A2A (Agent-to-Agent) protocol.
          See{" "}
          <Link
            href="/docs/agents"
            className="text-[#d4af37] hover:underline"
          >
            AI Agents (A2A)
          </Link>{" "}
          for the full protocol reference.
        </p>
        <CodeBlock title="POST /api/v1/agents/:id/a2a">{`curl -X POST https://gateway.inbotwetrust.com/api/v1/agents/AGENT_ID/a2a \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "message/send",
    "params": {
      "message": {
        "role": "user",
        "parts": [{ "kind": "text", "text": "Your task here" }]
      }
    },
    "id": 1
  }'`}</CodeBlock>
      </DocSection>

      <DocSection title="SDKs">
        <p className="text-[#888] mb-4">
          Python and TypeScript SDKs are coming soon. For now, use the raw
          JSON-RPC protocol above or any MCP client library — the gateway
          speaks standard MCP.
        </p>
        <TabGroup
          storageKey="sdk-lang"
          tabs={[
            {
              label: "Python",
              content: (
                <div className="p-4 rounded-lg bg-[rgba(212,175,55,0.05)] border border-[rgba(212,175,55,0.2)] text-sm text-[#888]">
                  <p className="font-medium text-[#ccc] mb-2">Coming Soon</p>
                  <p>
                    The Python SDK will provide a high-level client with
                    automatic session management, tool discovery, and payment
                    handling.
                  </p>
                  <CodeBlock>{`# Coming soon
from ibwt import Gateway

gw = Gateway(api_key="YOUR_API_KEY")
servers = gw.find_servers("database")
result = gw.call_tool("Neon__list_projects")`}</CodeBlock>
                </div>
              ),
            },
            {
              label: "TypeScript",
              content: (
                <div className="p-4 rounded-lg bg-[rgba(212,175,55,0.05)] border border-[rgba(212,175,55,0.2)] text-sm text-[#888]">
                  <p className="font-medium text-[#ccc] mb-2">Coming Soon</p>
                  <p>
                    The TypeScript SDK will provide a typed client for Node.js
                    and browser environments.
                  </p>
                  <CodeBlock>{`// Coming soon
import { Gateway } from "@ibwt/sdk";

const gw = new Gateway({ apiKey: "YOUR_API_KEY" });
const servers = await gw.findServers("database");
const result = await gw.callTool("Neon__list_projects");`}</CodeBlock>
                </div>
              ),
            },
          ]}
        />
      </DocSection>
    </>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/jasper/Documents/clawd/projects/ibwt/ibwt-ui && pnpm build 2>&1 | tail -5`

**Step 3: Commit**

```bash
git add app/docs/api-client/page.tsx
git commit -m "feat(docs): add API / Custom Client integration guide"
```

---

## Task 9: Create MCP Gateway Concept Page

**Files:**
- Create: `app/docs/mcp-gateway/page.tsx`

**Step 1: Create the page**

Core concept page explaining the reverse proxy architecture. Emphasize that everything is automatic.

```tsx
import { DocSection } from "@/components/docs/doc-section";
import { CodeBlock } from "@/components/docs/code-block";
import { TryItButton } from "@/components/docs/try-it-button";
import Link from "next/link";

export default function McpGatewayPage() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">MCP Gateway</h1>
      <p className="text-[#888] text-lg mb-12">
        How IBWT aggregates MCP servers behind a single endpoint and lets your
        AI handle everything automatically.
      </p>

      <DocSection title="How It Works">
        <p className="text-[#888] mb-6">
          IBWT Gateway is an MCP reverse proxy. Instead of configuring each MCP
          server individually, you connect once to the gateway. Your AI tool
          talks to the gateway, and the gateway routes requests to the right
          upstream server.
        </p>

        {/* Flow diagram */}
        <div className="border border-gray-800 rounded-xl p-6 mb-6 font-mono text-sm">
          <div className="flex flex-col items-center gap-3 text-[#888]">
            <div className="px-4 py-2 border border-[rgba(212,175,55,0.4)] rounded-lg text-[#d4af37]">
              Your AI Tool (Claude Code / Cursor / Windsurf)
            </div>
            <div className="text-[#666]">↓ JSON-RPC over HTTP</div>
            <div className="px-4 py-2 border-2 border-[#d4af37] rounded-lg text-[#d4af37] font-bold">
              IBWT Gateway
            </div>
            <div className="flex gap-8 mt-2">
              <div className="flex flex-col items-center gap-2">
                <div className="text-[#666]">↓</div>
                <div className="px-3 py-1.5 border border-gray-700 rounded text-[#ccc] text-xs">
                  GitHub
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="text-[#666]">↓</div>
                <div className="px-3 py-1.5 border border-gray-700 rounded text-[#ccc] text-xs">
                  Stripe
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="text-[#666]">↓</div>
                <div className="px-3 py-1.5 border border-gray-700 rounded text-[#ccc] text-xs">
                  Vercel
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="text-[#666]">↓</div>
                <div className="px-3 py-1.5 border border-gray-700 rounded text-[#ccc] text-xs">
                  ...more
                </div>
              </div>
            </div>
          </div>
        </div>
      </DocSection>

      <DocSection title="Automatic Discovery">
        <p className="text-[#888] mb-4">
          When your AI tool connects to the gateway, it receives a set of
          built-in <strong className="text-[#ccc]">meta-tools</strong> for
          discovering and managing MCP servers:
        </p>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-2 px-3 font-medium">Tool</th>
                <th className="text-left py-2 px-3 font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody className="text-[#888]">
              <tr className="border-b border-gray-800/50">
                <td className="py-2 px-3 font-mono text-xs text-[#ccc]">
                  gateway__find_servers
                </td>
                <td className="py-2 px-3">
                  Search for servers by keyword
                </td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="py-2 px-3 font-mono text-xs text-[#ccc]">
                  gateway__list_servers
                </td>
                <td className="py-2 px-3">Browse all available servers</td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="py-2 px-3 font-mono text-xs text-[#ccc]">
                  gateway__subscribe
                </td>
                <td className="py-2 px-3">
                  Activate a server to access its tools
                </td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="py-2 px-3 font-mono text-xs text-[#ccc]">
                  gateway__unsubscribe
                </td>
                <td className="py-2 px-3">Deactivate a server</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono text-xs text-[#ccc]">
                  gateway__list_subscriptions
                </td>
                <td className="py-2 px-3">
                  See your currently active servers
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[#888] mb-4">
          Your AI uses these tools autonomously — you ask for what you need, and
          the AI searches, subscribes, and calls the right tools without any
          manual steps.
        </p>
      </DocSection>

      <DocSection title="Tool Naming">
        <p className="text-[#888] mb-4">
          Tools from subscribed servers are namespaced with the server name to
          avoid collisions:
        </p>
        <CodeBlock>{`ServerName__tool_name

# Examples:
Vercel__list_projects
GitHub__search_repositories
Stripe__create_payment_link`}</CodeBlock>
      </DocSection>

      <DocSection title="Credential Injection">
        <p className="text-[#888] mb-4">
          Many MCP servers require API keys (GitHub tokens, Stripe keys, etc.).
          When you{" "}
          <Link
            href="/docs/credentials"
            className="text-[#d4af37] hover:underline"
          >
            store credentials
          </Link>
          , the gateway automatically injects the right headers on every
          upstream request. Your AI tool never sees the raw credentials.
        </p>
      </DocSection>

      <DocSection title="Browse the Marketplace">
        <p className="text-[#888] mb-4">
          See all available MCP servers right now:
        </p>
        <TryItButton
          label="Try it — List all servers"
          endpoint="/api/v1/mcp/list"
        />
      </DocSection>
    </>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/jasper/Documents/clawd/projects/ibwt/ibwt-ui && pnpm build 2>&1 | tail -5`

**Step 3: Commit**

```bash
git add app/docs/mcp-gateway/page.tsx
git commit -m "feat(docs): add MCP Gateway concept page with architecture diagram"
```

---

## Task 10: Rewrite AI Agents (A2A) Page

**Files:**
- Modify: `app/docs/agents/page.tsx`

**Step 1: Rewrite the page**

More practical, with real gateway URL, clearer explanation of A2A, and a TryIt button.

```tsx
import { CodeBlock } from "@/components/docs/code-block";
import { DocSection } from "@/components/docs/doc-section";
import { TryItButton } from "@/components/docs/try-it-button";
import Link from "next/link";

export default function AgentsDocPage() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">AI Agents (A2A)</h1>
      <p className="text-[#888] text-lg mb-12">
        Discover and call AI agents through the IBWT marketplace using the A2A
        (Agent-to-Agent) protocol. Send tasks, get results, stream responses.
      </p>

      <DocSection title="What is A2A?">
        <p className="text-[#888] mb-4">
          A2A (Agent-to-Agent) is a protocol for AI agents to communicate with
          each other. Through IBWT, you can discover agents in the marketplace
          and send them tasks via a standardized JSON-RPC interface — the
          gateway handles routing and payments.
        </p>
      </DocSection>

      <DocSection title="Discover Agents">
        <p className="text-[#888] mb-4">
          Browse all registered agents — no authentication required:
        </p>
        <CodeBlock>{`curl https://gateway.inbotwetrust.com/api/v1/agents`}</CodeBlock>
        <p className="text-[#888] mt-4 mb-4">Search by keyword:</p>
        <CodeBlock>{`curl https://gateway.inbotwetrust.com/api/v1/agents?q=research`}</CodeBlock>
        <div className="mt-4">
          <TryItButton
            label="Try it — List all agents"
            endpoint="/api/v1/agents"
          />
        </div>
      </DocSection>

      <DocSection title="Agent Card">
        <p className="text-[#888] mb-4">
          Each agent exposes an A2A-compatible Agent Card describing its
          capabilities, supported content types, and pricing:
        </p>
        <CodeBlock>{`curl https://gateway.inbotwetrust.com/api/v1/agents/AGENT_ID/agent-card`}</CodeBlock>
      </DocSection>

      <DocSection title="Send a Task">
        <p className="text-[#888] mb-4">
          Send a task to any agent through the gateway. The gateway handles
          routing and x402 payment if the agent has a price.
        </p>
        <CodeBlock title="POST /api/v1/agents/:id/a2a">{`curl -X POST https://gateway.inbotwetrust.com/api/v1/agents/AGENT_ID/a2a \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "message/send",
    "params": {
      "message": {
        "role": "user",
        "parts": [
          { "kind": "text", "text": "Research the latest MCP protocol changes" }
        ]
      }
    },
    "id": 1
  }'`}</CodeBlock>
      </DocSection>

      <DocSection title="Stream Responses">
        <p className="text-[#888] mb-4">
          For long-running tasks, use <code className="text-[#ccc]">message/stream</code>{" "}
          to receive incremental results via Server-Sent Events:
        </p>
        <CodeBlock>{`curl -X POST https://gateway.inbotwetrust.com/api/v1/agents/AGENT_ID/a2a \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Accept: text/event-stream" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "message/stream",
    "params": {
      "message": {
        "role": "user",
        "parts": [{ "kind": "text", "text": "Summarize this paper" }]
      }
    },
    "id": 1
  }'`}</CodeBlock>
      </DocSection>

      <DocSection title="Gateway as A2A Directory">
        <p className="text-[#888] mb-4">
          The IBWT gateway itself is discoverable as an A2A agent. Any A2A
          client can fetch its agent card at:
        </p>
        <CodeBlock>{`curl https://gateway.inbotwetrust.com/.well-known/agent.json`}</CodeBlock>
        <p className="text-[#888] mt-4">
          This lets other agents discover and interact with the full IBWT
          marketplace through standard A2A.
        </p>
      </DocSection>
    </>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/jasper/Documents/clawd/projects/ibwt/ibwt-ui && pnpm build 2>&1 | tail -5`

**Step 3: Commit**

```bash
git add app/docs/agents/page.tsx
git commit -m "feat(docs): rewrite AI Agents (A2A) page with practical examples"
```

---

## Task 11: Update Credentials Page

**Files:**
- Modify: `app/docs/credentials/page.tsx`

**Step 1: Add TryIt and improve flow**

Keep existing content structure but add interactive elements and use real gateway URL. Replace the import section and rewrite:

```tsx
import Link from "next/link";
import { CodeBlock } from "@/components/docs/code-block";
import { DocSection } from "@/components/docs/doc-section";

export default function CredentialsDocPage() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">Credentials</h1>
      <p className="text-[#888] text-lg mb-12">
        Store API keys for MCP servers that require authentication. The gateway
        encrypts them at rest and injects them automatically on every call.
      </p>

      <DocSection title="How It Works">
        <ul className="list-disc list-inside text-[#888] space-y-2 mb-4">
          <li>
            You store your API key (e.g., GitHub token, Stripe secret key) once
          </li>
          <li>
            Credentials are encrypted with AES-256-GCM — the gateway never
            exposes raw values
          </li>
          <li>
            When you call a tool, the gateway decrypts and injects the
            credential into the upstream request headers
          </li>
          <li>
            Storing a credential also auto-discovers the server&apos;s tools
          </li>
        </ul>
      </DocSection>

      <DocSection title="Store via Dashboard">
        <p className="text-[#888] mb-4">
          The easiest way: go to{" "}
          <Link
            href="/dashboard/secrets"
            className="text-[#d4af37] hover:underline"
          >
            Dashboard → Secrets
          </Link>
          , pick an MCP server, and paste your API key. Some services also
          support OAuth — click &quot;Connect with OAuth&quot; to authorize
          automatically.
        </p>
      </DocSection>

      <DocSection title="Store via API">
        <p className="text-[#888] mb-4">
          Store credentials programmatically:
        </p>
        <CodeBlock title="POST /api/v1/credentials">{`curl -X POST https://gateway.inbotwetrust.com/api/v1/credentials \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "mcp_id": "MCP_SERVER_ID",
    "tokens": {
      "GITHUB_TOKEN": "ghp_xxxxxxxxxxxx"
    }
  }'`}</CodeBlock>
        <p className="text-[#888] mt-4 text-sm">
          The <code className="text-[#ccc]">tokens</code> object keys must
          match the credential names defined in the server&apos;s auth config
          (visible on the server&apos;s detail page).
        </p>
      </DocSection>

      <DocSection title="List Credentials">
        <p className="text-[#888] mb-4">
          See which servers you have credentials stored for (token values are
          never returned):
        </p>
        <CodeBlock>{`curl https://gateway.inbotwetrust.com/api/v1/credentials \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</CodeBlock>
      </DocSection>

      <DocSection title="Delete Credentials">
        <CodeBlock>{`curl -X DELETE https://gateway.inbotwetrust.com/api/v1/credentials/MCP_SERVER_ID \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</CodeBlock>
      </DocSection>

      <DocSection title="OAuth">
        <p className="text-[#888]">
          Some MCP servers support OAuth for automatic token management. Start
          the flow from the{" "}
          <Link
            href="/dashboard/secrets"
            className="text-[#d4af37] hover:underline"
          >
            Secrets dashboard
          </Link>{" "}
          — click &quot;Connect with OAuth&quot; and follow the authorization
          flow. The gateway handles token refresh automatically.
        </p>
      </DocSection>
    </>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/jasper/Documents/clawd/projects/ibwt/ibwt-ui && pnpm build 2>&1 | tail -5`

**Step 3: Commit**

```bash
git add app/docs/credentials/page.tsx
git commit -m "feat(docs): update credentials page with dashboard-first flow"
```

---

## Task 12: Update Payments Page

**Files:**
- Modify: `app/docs/payments/page.tsx`

**Step 1: Minor updates**

Read the current file and make minimal changes: ensure URLs use `https://gateway.inbotwetrust.com` consistently, keep existing content structure. No major rewrite needed — the current page is already solid.

Just verify that all URLs are correct and consistent. If any use template literals with `GATEWAY_URL`, replace with the hardcoded production URL.

**Step 2: Verify build**

Run: `cd /Users/jasper/Documents/clawd/projects/ibwt/ibwt-ui && pnpm build 2>&1 | tail -5`

**Step 3: Commit (if changes were made)**

```bash
git add app/docs/payments/page.tsx
git commit -m "fix(docs): ensure consistent gateway URLs on payments page"
```

---

## Task 13: Update Provider Guide

**Files:**
- Modify: `app/docs/providers/page.tsx`

**Step 1: Minor updates**

Same as Task 12 — ensure URLs are consistent, keep existing structure. The provider guide content is already solid.

**Step 2: Verify build & commit if changed**

```bash
git add app/docs/providers/page.tsx
git commit -m "fix(docs): ensure consistent gateway URLs on provider guide"
```

---

## Task 14: Create SDKs Coming Soon Page

**Files:**
- Create: `app/docs/sdks/page.tsx`

**Step 1: Create the placeholder page**

```tsx
import Link from "next/link";

export default function SdksPage() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">SDKs</h1>
      <p className="text-[#888] text-lg mb-8">
        Official Python and TypeScript SDKs are in development.
      </p>

      <div className="border border-[rgba(212,175,55,0.2)] rounded-xl p-6 bg-[rgba(212,175,55,0.03)]">
        <h2 className="text-xl font-semibold mb-3">Coming Soon</h2>
        <p className="text-[#888] mb-4">
          The SDKs will provide high-level clients with automatic session
          management, tool discovery, and payment handling — making it easy to
          integrate IBWT into any application.
        </p>
        <p className="text-[#888]">
          In the meantime, the gateway speaks standard MCP (JSON-RPC over HTTP),
          so any MCP client library works. See the{" "}
          <Link
            href="/docs/api-client"
            className="text-[#d4af37] hover:underline"
          >
            API / Custom Client
          </Link>{" "}
          guide for raw HTTP examples.
        </p>
      </div>
    </>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/jasper/Documents/clawd/projects/ibwt/ibwt-ui && pnpm build 2>&1 | tail -5`

**Step 3: Commit**

```bash
git add app/docs/sdks/page.tsx
git commit -m "feat(docs): add SDKs coming soon placeholder page"
```

---

## Task 15: Rewrite Dashboard Developer Page

**Files:**
- Modify: `app/dashboard/developer/page.tsx`

**Step 1: Rewrite with integration guides**

Replace the 6 curl examples with a TabGroup showing integration configs, auto-filling the user's API key.

```tsx
"use client";

import { useState } from "react";
import { useGatewayStore } from "@/lib/gateway-store";
import { TabGroup } from "@/components/docs/tab-group";
import Link from "next/link";

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080";
const GATEWAY_ENDPOINT = `${GATEWAY_URL}/api/v1/mcp/gateway`;

function maskKey(key: string) {
  if (key.length <= 12) return key;
  return `${key.slice(0, 8)}${"*".repeat(8)}${key.slice(-4)}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[rgba(212,175,55,0.3)] text-[#d4af37] hover:bg-[rgba(212,175,55,0.1)] transition"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function CodeWithCopy({ code }: { code: string }) {
  return (
    <div className="relative group">
      <pre className="px-4 py-3 bg-[rgba(255,255,255,0.03)] border border-gray-800 rounded-lg text-sm font-mono text-[#ccc] overflow-x-auto whitespace-pre-wrap">
        {code}
      </pre>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
        <CopyButton text={code} />
      </div>
    </div>
  );
}

export default function DeveloperPage() {
  const { apiKey } = useGatewayStore();
  const [revealed, setRevealed] = useState(false);

  const keyDisplay = apiKey || "YOUR_API_KEY";

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Developer</h1>

      {/* API Key */}
      <div className="border border-gray-800 rounded-xl p-5 mb-4">
        <h2 className="font-semibold mb-1">API Key</h2>
        <p className="text-sm text-[#888] mb-4">
          Use this key to authenticate requests to the IBWT gateway.
        </p>
        {apiKey ? (
          <div className="flex items-center gap-3">
            <code className="flex-1 px-4 py-2.5 bg-[rgba(255,255,255,0.03)] border border-gray-800 rounded-lg text-sm font-mono text-[#ccc] truncate">
              {revealed ? apiKey : maskKey(apiKey)}
            </code>
            <button
              onClick={() => setRevealed(!revealed)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-700 text-[#888] hover:text-[#ccc] hover:border-gray-600 transition"
            >
              {revealed ? "Hide" : "Reveal"}
            </button>
            <CopyButton text={apiKey} />
          </div>
        ) : (
          <p className="text-sm text-[#666]">
            No API key available. Connect your wallet to generate one.
          </p>
        )}
      </div>

      {/* Gateway Endpoint */}
      <div className="border border-gray-800 rounded-xl p-5 mb-4">
        <h2 className="font-semibold mb-1">Gateway Endpoint</h2>
        <p className="text-sm text-[#888] mb-4">
          Point your AI tools to this URL to access all registered MCP servers
          and agents.
        </p>
        <div className="flex items-center gap-3">
          <code className="flex-1 px-4 py-2.5 bg-[rgba(255,255,255,0.03)] border border-gray-800 rounded-lg text-sm font-mono text-[#ccc] truncate">
            {GATEWAY_ENDPOINT}
          </code>
          <CopyButton text={GATEWAY_ENDPOINT} />
        </div>
      </div>

      {/* Integration Guides */}
      <div className="border border-gray-800 rounded-xl p-5 mb-4">
        <h2 className="font-semibold mb-1">Integration</h2>
        <p className="text-sm text-[#888] mb-4">
          Copy the config for your AI tool. Your API key is pre-filled.
        </p>
        <TabGroup
          storageKey="dev-integration"
          tabs={[
            {
              label: "Claude Code",
              content: (
                <div>
                  <p className="text-xs text-[#888] mb-3">
                    Run in your terminal:
                  </p>
                  <CodeWithCopy
                    code={`claude mcp add ibwt-gateway \\\n  --transport http \\\n  -h "Authorization: Bearer ${keyDisplay}" \\\n  ${GATEWAY_ENDPOINT}`}
                  />
                </div>
              ),
            },
            {
              label: "Cursor",
              content: (
                <div>
                  <p className="text-xs text-[#888] mb-3">
                    Add to{" "}
                    <code className="text-[#ccc]">.cursor/mcp.json</code>:
                  </p>
                  <CodeWithCopy
                    code={JSON.stringify(
                      {
                        mcpServers: {
                          "ibwt-gateway": {
                            url: GATEWAY_ENDPOINT,
                            headers: {
                              Authorization: `Bearer ${keyDisplay}`,
                            },
                          },
                        },
                      },
                      null,
                      2
                    )}
                  />
                </div>
              ),
            },
            {
              label: "Windsurf",
              content: (
                <div>
                  <p className="text-xs text-[#888] mb-3">
                    Add to your Windsurf MCP config:
                  </p>
                  <CodeWithCopy
                    code={JSON.stringify(
                      {
                        mcpServers: {
                          "ibwt-gateway": {
                            serverUrl: GATEWAY_ENDPOINT,
                            headers: {
                              Authorization: `Bearer ${keyDisplay}`,
                            },
                          },
                        },
                      },
                      null,
                      2
                    )}
                  />
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* SDKs */}
      <div className="border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold mb-1">SDKs</h2>
        <p className="text-sm text-[#888]">
          Python and TypeScript SDKs are coming soon. See the{" "}
          <Link href="/docs/api-client" className="text-[#d4af37] hover:underline">
            API / Custom Client
          </Link>{" "}
          guide for raw HTTP integration.
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/jasper/Documents/clawd/projects/ibwt/ibwt-ui && pnpm build 2>&1 | tail -5`

**Step 3: Commit**

```bash
git add app/dashboard/developer/page.tsx
git commit -m "feat(dashboard): rewrite developer page with integration guides and auto-filled API key"
```

---

## Task 16: Final Verification & Cleanup

**Step 1: Full build**

Run: `cd /Users/jasper/Documents/clawd/projects/ibwt/ibwt-ui && pnpm build`
Expected: Build succeeds with no errors

**Step 2: Check for dead links in sidebar**

Verify each route in the sidebar has a corresponding page:
- `/docs` → `app/docs/page.tsx` ✓
- `/docs/quickstart` → `app/docs/quickstart/page.tsx` ✓
- `/docs/claude-code` → `app/docs/claude-code/page.tsx` ✓
- `/docs/cursor-windsurf` → `app/docs/cursor-windsurf/page.tsx` ✓
- `/docs/api-client` → `app/docs/api-client/page.tsx` ✓
- `/docs/mcp-gateway` → `app/docs/mcp-gateway/page.tsx` ✓
- `/docs/agents` → `app/docs/agents/page.tsx` ✓
- `/docs/credentials` → `app/docs/credentials/page.tsx` ✓
- `/docs/payments` → `app/docs/payments/page.tsx` ✓
- `/docs/providers` → `app/docs/providers/page.tsx` ✓
- `/docs/sdks` → `app/docs/sdks/page.tsx` ✓

**Step 3: Clean up old files**

Delete old pages that were replaced:
- `app/docs/mcps/page.tsx` (replaced by `mcp-gateway`)
- `app/docs/api/page.tsx` (API Reference deferred)
- `components/docs/endpoint-row.tsx` (no longer used)

**Step 4: Commit cleanup**

```bash
git add -A
git commit -m "chore: remove old docs pages replaced by new structure"
```
