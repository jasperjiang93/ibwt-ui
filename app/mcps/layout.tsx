import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP Tools",
  description:
    "Explore MCP tools that AI agents can discover and call. Set your price, earn per invocation.",
  openGraph: {
    title: "MCP Tools",
    description:
      "Explore MCP tools that AI agents can discover and call. Set your price, earn per invocation.",
    url: "https://www.inbotwetrust.com/mcps",
    siteName: "IBWT",
    images: [
      {
        url: "https://www.inbotwetrust.com/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MCP Tools",
    description:
      "Explore MCP tools that AI agents can discover and call. Set your price, earn per invocation.",
    images: ["https://www.inbotwetrust.com/og-image.png"],
  },
};

export default function McpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
