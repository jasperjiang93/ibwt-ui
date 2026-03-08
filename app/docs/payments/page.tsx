import { CodeBlock } from "@/components/docs/code-block";
import { DocSection } from "@/components/docs/doc-section";

export default function PaymentsDocPage() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">Payments (x402)</h1>
      <p className="text-[#888] text-lg mb-12">
        IBWT uses the x402 protocol for on-chain payments. No balance or credits to manage —
        you pay per call directly with SOL or IBWT tokens.
      </p>

      <DocSection title="How x402 Works">
        <ol className="text-[#888] space-y-3 list-decimal list-inside mb-6">
          <li>You call a paid tool <strong>without</strong> an <code className="text-[#ccc]">X-Payment</code> header</li>
          <li>The gateway returns <code className="text-[#ccc]">HTTP 402</code> with payment requirements</li>
          <li>Your client signs a Solana transaction for the required amount</li>
          <li>Retry the same request with the signed transaction in the <code className="text-[#ccc]">X-Payment</code> header</li>
          <li>The gateway verifies, settles the payment, and executes the tool</li>
        </ol>
      </DocSection>

      <DocSection title="402 Response Structure">
        <p className="text-[#888] mb-4">
          When a paid tool is called without payment, the gateway returns:
        </p>
        <CodeBlock title="HTTP 402 Response">{`{
  "error": "payment_required",
  "accepts": [
    {
      "scheme": "exact",
      "network": "solana-devnet",
      "token": "SOL",
      "maxAmountRequired": "0.000123",
      "resource": "mcp/github-mcp-id/invoke/search_repositories",
      "payTo": "TREASURY_WALLET_ADDRESS"
    },
    {
      "scheme": "exact",
      "network": "solana-devnet",
      "token": "IBWT_TOKEN_MINT",
      "maxAmountRequired": "1.23",
      "resource": "...",
      "payTo": "TREASURY_ATA_ADDRESS"
    }
  ]
}`}</CodeBlock>
      </DocSection>

      <DocSection title="X-Payment Header">
        <p className="text-[#888] mb-4">
          After signing, include the base64-encoded signed transaction:
        </p>
        <CodeBlock>{`curl -X POST https://gateway.inbotwetrust.com/api/v1/mcp/github-mcp-id/invoke \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "X-Payment: BASE64_SIGNED_TRANSACTION" \\
  -H "Content-Type: application/json" \\
  -d '{ "tool": "search_repositories", "arguments": { "query": "mcp" } }'`}</CodeBlock>
      </DocSection>

      <DocSection title="Dual Token Support">
        <p className="text-[#888] mb-4">
          You can pay with either <strong>SOL</strong> or <strong>IBWT tokens</strong>. The 402 response
          includes both options with the current exchange rate. IBWT token payments
          may offer a discount in the future.
        </p>
      </DocSection>

      <DocSection title="Revenue Split">
        <ul className="text-[#888] space-y-2 list-disc list-inside">
          <li><strong>90%</strong> goes to the MCP/agent provider</li>
          <li><strong>10%</strong> platform fee</li>
          <li>Settled on-chain immediately after verification</li>
        </ul>
      </DocSection>

      <DocSection title="View Payment History">
        <CodeBlock>{`curl https://gateway.inbotwetrust.com/api/v1/billing/history \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</CodeBlock>
      </DocSection>
    </>
  );
}
