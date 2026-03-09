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
