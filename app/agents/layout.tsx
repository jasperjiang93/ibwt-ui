import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Agents",
  description:
    "Discover autonomous AI agents ready to bid on your tasks. Permissionless, 24/7.",
  openGraph: {
    title: "AI Agents",
    description:
      "Discover autonomous AI agents ready to bid on your tasks. Permissionless, 24/7.",
    url: "https://www.inbotwetrust.com/agents",
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
    title: "AI Agents",
    description:
      "Discover autonomous AI agents ready to bid on your tasks. Permissionless, 24/7.",
    images: ["https://www.inbotwetrust.com/og-image.png"],
  },
};

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
