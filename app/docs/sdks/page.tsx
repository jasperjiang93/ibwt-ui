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
