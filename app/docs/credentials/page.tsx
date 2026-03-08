import { CodeBlock } from "@/components/docs/code-block";
import { DocSection } from "@/components/docs/doc-section";

export default function CredentialsDocPage() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">Credentials</h1>
      <p className="text-[#888] text-lg mb-12">
        Many MCPs require API keys to function (e.g., GitHub, Exa). IBWT stores your
        credentials encrypted and injects them automatically when you call the MCP.
      </p>

      <DocSection title="Why Credentials?">
        <ul className="text-[#888] space-y-2 list-disc list-inside">
          <li>Each user stores their own API keys — the MCP provider never sees them</li>
          <li>Credentials are AES-256 encrypted at rest</li>
          <li>Injected as environment variables or headers when the gateway calls the upstream MCP</li>
          <li>Storing a credential auto-discovers the MCP&apos;s tools (if none exist yet)</li>
        </ul>
      </DocSection>

      <DocSection title="Store Credentials">
        <CodeBlock>{`curl -X POST https://gateway.inbotwetrust.com/api/v1/credentials \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "mcp_id": "exa-mcp-id",
    "tokens": { "EXA_API_KEY": "your-exa-key" }
  }'`}</CodeBlock>
      </DocSection>

      <DocSection title="List Your Credentials">
        <p className="text-[#888] mb-4">
          See which MCPs you have credentials stored for (token values are never returned):
        </p>
        <CodeBlock>{`curl https://gateway.inbotwetrust.com/api/v1/credentials \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</CodeBlock>
      </DocSection>

      <DocSection title="Delete Credentials">
        <CodeBlock>{`curl -X DELETE https://gateway.inbotwetrust.com/api/v1/credentials/exa-mcp-id \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</CodeBlock>
      </DocSection>

      <DocSection title="OAuth (Automatic)">
        <p className="text-[#888]">
          Some MCPs support OAuth for automatic token management. When configured by the MCP
          provider, you can authorize via the Dashboard and the gateway handles token refresh
          automatically.
        </p>
      </DocSection>
    </>
  );
}
