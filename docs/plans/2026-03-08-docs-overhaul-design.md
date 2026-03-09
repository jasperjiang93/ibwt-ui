# Docs & Developer Page Overhaul

Date: 2026-03-08

## Problem

Current docs are organized by system module, not user journey. Examples use placeholders, no integration guides for popular AI tools, and the dashboard Developer page shows curl snippets nobody copies. Users don't understand what IBWT does or how to start using it.

## Goals

1. Make users understand what IBWT is in 10 seconds
2. Let users integrate the gateway into Claude Code / Cursor / Windsurf in 30 seconds
3. Show the AI-driven workflow: AI auto-discovers, subscribes, and calls tools — zero manual steps
4. Add interactive elements (TryIt buttons, live API responses) so docs feel alive

## Target Audience

Primary: AI tool users (Claude Code, Cursor, Windsurf users)
Secondary: Agent developers (SDK coming soon, placeholder only)

## Information Architecture

### Sidebar Navigation

```
IBWT Docs

  Overview
  Quick Start

INTEGRATE
  Claude Code
  Cursor & Windsurf
  API / Custom Client

CONCEPTS
  MCP Gateway
  AI Agents (A2A)
  Credentials
  Payments (x402)

BUILD
  Provider Guide
  SDKs (Coming Soon)
```

No API Reference for now — will be added later.

## Page Designs

### Overview (rewrite)

Opening line: "IBWT is a unified gateway for the AI economy — one endpoint to access a growing marketplace of MCP tools and AI agents. Configure once, use everything."

Three value prop cards:
- One endpoint, all tools — MCP reverse proxy aggregating a growing marketplace
- AI Agent Marketplace — A2A protocol, discover and call AI agents
- Pay per use — x402 on-chain payments, pay only for what you use

Interactive element: TryIt button calling `GET /api/v1/mcp/list` to show real server data, so users immediately see Stripe, GitHub, Vercel etc.

### Quick Start (rewrite)

3 steps (not 5):
1. Connect wallet at dashboard → auto-get API key
2. Add to your tool (Claude Code one-liner / Cursor JSON config)
3. Start using — talk to Claude, it auto-discovers and uses tools

Key change: lead with tool integration, not curl commands. Most users never write curl.

### Claude Code (new page)

End-to-end guide:
1. One command: `claude mcp add ibwt-gateway --transport http -h "Authorization: Bearer YOUR_KEY" https://gateway.inbotwetrust.com/api/v1/mcp/gateway`
2. Restart Claude Code
3. Start chatting — Claude auto-discovers gateway meta-tools, searches for servers, subscribes, and calls tools
4. For auth-required services: store credentials via dashboard or API
5. Example conversation showing the flow

### Cursor & Windsurf (new page)

JSON config for `.cursor/mcp.json` and Windsurf equivalent.
Same flow: configure → restart → AI auto-discovers tools.

### API / Custom Client (merged rewrite)

For developers building their own integrations:
- MCP Gateway JSON-RPC (initialize, tools/list, tools/call)
- A2A calls (message/send, message/stream)
- TabGroup switching between curl / Python / TypeScript
- Python/TS examples marked "Coming Soon — SDK" with raw HTTP shown

### MCP Gateway (concept, rewrite)

Core message: everything is automatic.
- Gateway aggregates a growing marketplace of MCP servers behind one endpoint
- AI tools connect once, then the AI autonomously discovers, subscribes, and calls tools
- No manual subscription or configuration needed from the user
- Credentials: store once, gateway auto-injects auth headers on every call
- Simple flow diagram showing: Your AI Tool → IBWT Gateway → Upstream MCP Server → Response

### AI Agents / A2A (concept, rewrite)

- What A2A is and how it works through IBWT
- Agent cards, discovery, task sending
- Streaming support
- Practical examples with real gateway URL

### Credentials (minor update)

Add interactive elements. Keep existing content mostly intact.

### Payments / x402 (minor update)

Keep existing content mostly intact.

### Provider Guide (minor update)

Keep existing content mostly intact.

### SDKs — Coming Soon (new placeholder)

One paragraph: Python and TypeScript SDKs are in development. For now, use the raw HTTP API (link to API / Custom Client page).

## Dashboard Developer Page

Simplified to 3 blocks:

1. **API Key + Gateway Endpoint** — keep as-is
2. **Integration Guides** — TabGroup with Claude Code / Cursor / Windsurf configs, user's API key auto-filled
3. **SDKs Coming Soon** — one line

Remove the existing 6 curl examples (they duplicate docs content).

## New Components

### TryItButton
- Calls public gateway APIs (e.g., `/api/v1/mcp/list`)
- Shows real JSON response in a collapsible panel
- Loading state + error handling
- For authenticated endpoints: auto-fills API key if user is logged in

### TabGroup
- Multiple tabs for switching between content variants
- Used for: Claude Code / Cursor / Windsurf configs
- Used for: curl / Python / TypeScript examples
- Persists selection via localStorage

### ApiEndpoint (future, for API Reference page)
- Expandable endpoint documentation
- Request/response examples
- Not needed for this phase

## Implementation Order

1. New components (TryItButton, TabGroup)
2. Docs layout (new sidebar navigation)
3. Overview page
4. Quick Start page
5. Claude Code integration page
6. Cursor & Windsurf integration page
7. API / Custom Client page
8. MCP Gateway concept page
9. AI Agents (A2A) concept page
10. Credentials page (minor update)
11. Payments page (minor update)
12. Provider Guide (minor update)
13. SDKs Coming Soon placeholder
14. Dashboard Developer page
