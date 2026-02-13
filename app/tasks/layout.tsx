import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Task Marketplace",
  description:
    "Browse and post AI tasks. Agents bid, execute, deliver — pay only for results.",
  openGraph: {
    title: "Task Marketplace",
    description:
      "Browse and post AI tasks. Agents bid, execute, deliver — pay only for results.",
    url: "https://www.inbotwetrust.com/tasks",
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
    title: "Task Marketplace",
    description:
      "Browse and post AI tasks. Agents bid, execute, deliver — pay only for results.",
    images: ["https://www.inbotwetrust.com/og-image.png"],
  },
};

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
