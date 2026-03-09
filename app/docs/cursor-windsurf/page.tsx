import { CodeBlock } from "@/components/docs/code-block";
import { DocSection } from "@/components/docs/doc-section";
import { TabGroup } from "@/components/docs/tab-group";
import Link from "next/link";

export default function CursorWindsurfPage() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">Cursor &amp; Windsurf</h1>
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

      <DocSection title="3. Restart &amp; Use">
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
